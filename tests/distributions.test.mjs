import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { distributions, distributionById, defaults, density, validParameter } from "../assets/js/distributions/registry.js";
import { sampleDistribution, defaultRange, histogram, densityCurve, densityYRange, sliderRange, sliderPosition, sliderValue } from "../assets/js/distributions/model.js";
import { initialState, restoreState, shareState } from "../assets/js/distributions/state.js";

const fixtures = JSON.parse(await readFile(new URL("./distribution-reference.json", import.meta.url), "utf8"));

function close(actual, expected, relative = 2e-6, absolute = 5e-8) {
  assert.ok(Number.isFinite(actual), `Expected a finite number; got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= absolute + relative * Math.abs(expected), `${actual} differs from ${expected}`);
}

for (const fixture of fixtures) {
  test(`${fixture.id} agrees with SciPy at ${JSON.stringify(fixture.parameters)}`, () => {
    const distribution = distributionById.get(fixture.id);
    for (const point of fixture.points) {
      close(density(distribution, point.x, fixture.parameters), point.pdf);
      close(distribution.cdf(point.x, fixture.parameters), point.cdf, 0, 5e-7);
    }
    for (const point of fixture.quantiles) close(distribution.quantile(point.u, fixture.parameters), point.x, 2e-5);
  });
}

test("all registered samplers reproduce the reference CDF, including heavy tails", () => {
  for (const fixture of fixtures) {
    const distribution = distributionById.get(fixture.id);
    const samples = sampleDistribution(distribution, fixture.parameters, 10000, 8071);
    assert.ok(samples.every(Number.isFinite), `${fixture.id} produced a nonfinite sample`);
    for (const u of [0.1, 0.5, 0.9]) {
      const threshold = fixture.quantiles.find(point => point.u === u).x;
      const observed = samples.filter(x => x <= threshold).length / samples.length;
      assert.ok(Math.abs(observed - u) < 0.02, `${fixture.id}: empirical CDF ${observed} at theoretical probability ${u}`);
    }
  }
});

test("samples repeat for the same seed and change for another seed", () => {
  const distribution = distributionById.get("gb2");
  const parameters = defaults(distribution);
  assert.deepEqual(sampleDistribution(distribution, parameters, 30, 42), sampleDistribution(distribution, parameters, 30, 42));
  assert.notDeepEqual(sampleDistribution(distribution, parameters, 30, 42), sampleDistribution(distribution, parameters, 30, 43));
});

test("histogram area counts off-screen draws in its denominator", () => {
  const result = histogram([-2, 0, 0.25, 0.75, 1, 3], [0, 1], 2);
  assert.deepEqual(result.counts, [2, 2]);
  assert.equal(result.outside, 2);
  close(result.y.reduce((sum, y, i) => sum + y * result.widths[i], 0), 4 / 6);
  const zoomed = histogram([-2, 0, 0.25, 0.75, 1, 3], [0, 0.5], 2);
  close(zoomed.y.reduce((sum, y, i) => sum + y * zoomed.widths[i], 0), 2 / 6);
});

test("logarithmic bins are normalized by their actual, unequal widths", () => {
  const result = histogram([1, 3, 30, 300], [1, 100], 2, true);
  close(result.edges[1], 10);
  close(result.y[0], 2 / (4 * 9));
  close(result.y[1], 1 / (4 * 90));
  close(result.y.reduce((sum, y, i) => sum + y * result.widths[i], 0), 0.75);
});

test("out-of-range machine values are counted rather than silently renormalized", () => {
  const result = histogram([0.5, Infinity, NaN, -Infinity], [0, 1], 5);
  assert.equal(result.nonfinite, 3);
  close(result.y.reduce((sum, y, i) => sum + y * result.widths[i], 0), 0.25);
});

test("default plot ranges cover finite, infinite, and logarithmic support", () => {
  for (const distribution of distributions) {
    const parameters = defaults(distribution);
    const samples = sampleDistribution(distribution, parameters, 1000, 42);
    const range = defaultRange(distribution, parameters, samples);
    assert.ok(range.every(Number.isFinite) && range[1] > range[0]);
    if (distribution.support(parameters)[0] === 0) {
      assert.equal(range[0], 0);
      assert.ok(defaultRange(distribution, parameters, samples, true)[0] > 0);
    }
  }
  const beta = distributionById.get("beta");
  assert.deepEqual(defaultRange(beta, defaults(beta), []), [0, 1]);
});

test("singular boundary densities never become Infinity in the plot", () => {
  const beta = distributionById.get("beta");
  const curve = densityCurve(beta, { alpha: 0.4, beta: 0.4 }, [0, 1]);
  assert.equal(curve.y[0], null);
  assert.equal(curve.y.at(-1), null);
  assert.ok(curve.y.every(y => y === null || Number.isFinite(y)));
  assert.ok(Number.isFinite(curve.suggestedMax) && curve.suggestedMax > 0);
});

test("Student-t moments reflect the selected degrees of freedom", () => {
  const student = distributionById.get("student-t");
  assert.deepEqual(student.moments({ df: 0.7, mu: 3, scale: 2 }), { mean: null, sd: null });
  assert.deepEqual(student.moments({ df: 2, mu: 3, scale: 2 }), { mean: 3, sd: Infinity });
  close(student.moments({ df: 5, mu: 3, scale: 2 }).sd, 2 * Math.sqrt(5 / 3));
});

test("Student-t y ceiling uses its exact peak, including off-grid and off-screen modes", () => {
  const student = distributionById.get("student-t");
  const parameters = { df: 1, mu: 1.234, scale: 1.7 };
  const peak = 1 / (Math.PI * parameters.scale);
  for (const domain of [[-90, 110], [-1, 3], [-90, -85]]) {
    const curve = densityCurve(student, parameters, domain);
    close(curve.suggestedMax, peak, 1e-9, 1e-12);
    close(densityYRange(curve)[1], 1.35 * peak, 1e-9, 1e-12);
    close(10 ** densityYRange(curve, true)[1], 1.35 * peak, 1e-9, 1e-12);
  }
});

test("moving a normal peak across the plotting grid does not jitter the y bound", () => {
  const normal = distributionById.get("normal");
  const expected = 1.35 / (0.8 * Math.sqrt(2 * Math.PI));
  for (const mu of [-0.913, -0.01, 0.017, 0.425, 1.234]) {
    close(densityYRange(densityCurve(normal, { mu, sigma: 0.8 }, [-10, 10]))[1], expected, 1e-10);
  }
});

test("GB2 reduces to beta prime when a = b = 1", () => {
  const gb2 = distributionById.get("gb2");
  const parameters = { a: 1, b: 1, p: 1, q: 1 };
  for (const x of [0.01, 0.5, 1, 10, 1000]) {
    close(density(gb2, x, parameters), 1 / (1 + x) ** 2);
    close(gb2.cdf(x, parameters), x / (1 + x));
  }
});

test("positive parameters can extend slider ranges without permitting zero", () => {
  const parameter = distributionById.get("gamma").parameters[0];
  assert.equal(validParameter(parameter, 0), false);
  assert.equal(validParameter(parameter, Infinity), false);
  assert.equal(validParameter(parameter, -2), false);
  assert.equal(validParameter(parameter, 0.025), true);
  const bounds = sliderRange(parameter, 0.025);
  const position = sliderPosition(0.025, bounds, "log");
  close(sliderValue(position, bounds, "log"), 0.025);
});

test("untrusted saved settings cannot insert invalid parameters or control values", () => {
  const state = restoreState({ id: "student-t", count: -1, bins: 1e9, seed: 1.5, logX: true, range: [2, 1],
    models: { "student-t": { parameters: { df: -1, mu: "oops", scale: 2 }, labels: { df: "My quantity" } } } });
  assert.equal(state.count, 2000);
  assert.equal(state.bins, 40);
  assert.equal(state.seed, 42);
  assert.equal(state.logX, false);
  assert.equal(state.range, null);
  assert.deepEqual(state.models["student-t"].parameters, { df: 5, mu: 0, scale: 2 });
  assert.equal(state.models["student-t"].labels.df, "My quantity");
});

test("a shared configuration preserves labels, parameters, view, and seed", () => {
  const state = initialState();
  state.id = "student-t";
  state.models["student-t"].parameters.df = 2.5;
  state.models["student-t"].labels.df = "Tail flexibility";
  state.range = [-10, 12];
  state.variable = "Growth rate";
  state.seed = 207;
  const restored = restoreState(JSON.parse(JSON.stringify(shareState(state))));
  assert.deepEqual(restored, state);
});
