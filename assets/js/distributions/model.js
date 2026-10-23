import { seededRandom } from "./math.js";
import { density } from "./registry.js";

export function sampleDistribution(distribution, parameters, count, seed) {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => distribution.sample(parameters, random));
}

export function defaultRange(distribution, parameters, samples, logX = false) {
  const support = distribution.support?.(parameters) ?? [-Infinity, Infinity];
  const sorted = samples.filter(x => Number.isFinite(x) && (!logX || x > 0)).sort((a, b) => a - b);
  const quantile = u => distribution.quantile?.(u, parameters) ?? sorted[Math.floor(u * (sorted.length - 1))];
  let lo = Number.isFinite(support[0]) && !logX ? support[0] : quantile(0.005);
  let hi = Number.isFinite(support[1]) ? support[1] : quantile(0.995);
  if (!Number.isFinite(lo)) lo = sorted[Math.floor(0.005 * sorted.length)];
  if (!Number.isFinite(hi)) hi = sorted[Math.min(sorted.length - 1, Math.floor(0.995 * sorted.length))];
  if (logX && !(lo > 0)) lo = sorted.find(x => x > 0) ?? hi * 1e-6;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo) || (logX && lo <= 0)) {
    throw new Error("These parameters exceed the plotting range. Try values closer to the defaults.");
  }
  return [lo, hi];
}

export function histogram(samples, [lo, hi], bins, logX = false) {
  const start = logX ? Math.log(lo) : lo;
  const end = logX ? Math.log(hi) : hi;
  const step = (end - start) / bins;
  const edges = Array.from({ length: bins + 1 }, (_, i) => logX ? Math.exp(start + step * i) : start + step * i);
  edges[0] = lo;
  edges[bins] = hi;
  const counts = Array(bins).fill(0);
  let outside = 0;
  let nonfinite = 0;
  for (const x of samples) {
    if (!Number.isFinite(x)) {
      nonfinite++;
    } else if (x < lo || x > hi || (logX && x <= 0)) {
      outside++;
    } else {
      const bin = Math.min(bins - 1, Math.max(0, Math.floor(((logX ? Math.log(x) : x) - start) / step)));
      counts[bin]++;
    }
  }
  const widths = counts.map((_, i) => edges[i + 1] - edges[i]);
  return {
    edges, counts, widths, outside, nonfinite,
    x: counts.map((_, i) => edges[i] + widths[i] / 2),
    // Keep the full sample size in the denominator, including off-screen draws.
    // Zooming therefore never turns the histogram into a conditional density.
    y: counts.map((n, i) => n / (samples.length * widths[i])),
  };
}

export function densityCurve(distribution, parameters, [lo, hi], logX = false) {
  const uniform = Array.from({ length: 501 }, (_, i) => {
    const t = i / 500;
    return logX ? Math.exp(Math.log(lo) * (1 - t) + Math.log(hi) * t) : lo * (1 - t) + hi * t;
  });
  const adaptive = distribution.quantile ? Array.from({ length: 399 }, (_, i) => distribution.quantile((i + 1) / 400, parameters)) : [];
  const modes = [distribution.mode?.(parameters)].flat().filter(Number.isFinite);
  const x = [...new Set([...uniform, ...adaptive, ...modes])].filter(x => Number.isFinite(x) && x >= lo && x <= hi && (!logX || x > 0)).sort((a, b) => a - b);
  const y = x.map(value => {
    const result = density(distribution, value, parameters);
    return Number.isFinite(result) ? result : null;
  });
  // Include exact modes so a peak moving between grid points cannot jitter the
  // vertical range, and adaptive peaks for definitions without a known mode.
  // Only singular boundaries need the finite, interior-based cap.
  const interior = uniform.slice(1, -1).map(value => density(distribution, value, parameters)).filter(Number.isFinite);
  const peaks = modes.map(value => density(distribution, value, parameters)).filter(Number.isFinite);
  const singularBoundary = [lo, hi].some(value => density(distribution, value, parameters) === Infinity);
  const visible = singularBoundary ? interior : y.filter(Number.isFinite);
  return { x, y, suggestedMax: Math.max(0, ...visible, ...peaks) };
}

export function densityYRange(curve, logY = false) {
  const peak = curve.suggestedMax;
  if (!(peak > 0) || !Number.isFinite(peak)) {
    throw new Error("This range has no plottable density. Choose Fit range or adjust the parameters.");
  }
  // Headroom belongs to the PDF, never to whichever sampled bin is tallest.
  const ceiling = peak * 1.35;
  return logY ? [Math.log10(peak) - 5, Math.log10(ceiling)] : [0, ceiling];
}

export function sliderRange(parameter, value) {
  return [Math.min(parameter.slider.min, value), Math.max(parameter.slider.max, value)];
}

export function sliderPosition(value, [min, max], scale) {
  return scale === "log" ? (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min)) : (value - min) / (max - min);
}

export function sliderValue(position, [min, max], scale) {
  const value = scale === "log" ? Math.exp(Math.log(min) + position * (Math.log(max) - Math.log(min))) : min + position * (max - min);
  return Number(value.toPrecision(5));
}
