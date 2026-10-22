import { distributions, distributionById, defaults, validParameter } from "./registry.js";
import { sampleDistribution, defaultRange, histogram, densityCurve, sliderRange, sliderPosition, sliderValue } from "./model.js";
import { initialState, restoreState, shareState, STORAGE_KEY } from "./state.js";

const element = id => document.getElementById(`de-${id}`);
const plot = element("plot");
const status = element("status");
const error = element("error");
const text = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const format = value => {
  if (value === null) return "Undefined";
  if (value === undefined || Number.isNaN(value)) return "—";
  if (!Number.isFinite(value)) return value < 0 ? "−∞" : "∞";
  if (value === 0) return "0";
  return Math.abs(value) >= 1e5 || Math.abs(value) < 0.001 ? value.toExponential(3) : Number(value.toPrecision(5)).toLocaleString("en-US", { maximumSignificantDigits: 5 });
};

let state = initialState();
try {
  const linked = new URLSearchParams(location.hash.slice(1)).get("config");
  state = restoreState(JSON.parse(linked ?? sessionStorage.getItem(STORAGE_KEY) ?? "null"));
} catch {
  status.textContent = "Saved settings could not be read. Showing the defaults.";
}

let sampleCache = { key: "", values: [] };
let lastDomain = null;
let frame = null;
let rendering = false;
let dirty = false;
let plotEventsBound = false;
const current = () => distributionById.get(state.id);
const model = () => state.models[state.id];

function save() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Settings are optional in private browsing. */ }
  if (new URLSearchParams(location.hash.slice(1)).has("config")) {
    const url = new URL(location.href);
    url.hash = new URLSearchParams({ config: JSON.stringify(shareState(state)) }).toString();
    history.replaceState(null, "", url);
  }
}

function schedule() {
  save();
  if (frame === null) frame = requestAnimationFrame(() => { frame = null; render(); });
}

function syncSettings() {
  element("distribution").value = state.id;
  for (const key of ["count", "bins", "seed", "variable"]) element(key).value = state[key];
  for (const [id, key] of [["log-x", "logX"], ["log-y", "logY"], ["show-density", "showDensity"], ["show-histogram", "showHistogram"]]) element(id).checked = state[key];
  const positiveSupport = (current().support?.(model().parameters)?.[0] ?? -Infinity) >= 0;
  element("log-x").disabled = !positiveSupport;
  element("log-x").parentElement.title = positiveSupport ? "Use a logarithmic horizontal axis" : "Log x is available for distributions with nonnegative support";
  element("lock-range").checked = state.range !== null;
}

function buildParameters() {
  const distribution = current();
  element("description").textContent = distribution.description;
  element("parameters").replaceChildren();
  for (const parameter of distribution.parameters) {
    const row = document.createElement("div");
    row.className = "de-parameter";
    const top = document.createElement("div");
    top.className = "de-parameter-top";
    const symbol = document.createElement("label");
    symbol.className = "de-symbol";
    symbol.textContent = parameter.symbol;
    symbol.htmlFor = `de-value-${parameter.key}`;
    const name = document.createElement("input");
    name.type = "text";
    name.className = "de-parameter-name";
    name.maxLength = 64;
    name.value = model().labels[parameter.key] ?? parameter.label;
    name.setAttribute("aria-label", `Name for ${parameter.symbol}`);
    name.title = "Rename this parameter";
    name.spellcheck = false;
    const number = document.createElement("input");
    number.id = symbol.htmlFor;
    number.type = "number";
    number.className = "de-parameter-number";
    number.step = "any";
    number.required = true;
    number.value = model().parameters[parameter.key];
    number.title = parameter.description || parameter.label;
    if (parameter.min !== undefined) number.min = parameter.min;
    if (parameter.max !== undefined) number.max = parameter.max;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = 1000;
    slider.step = 1;
    const ends = document.createElement("div");
    ends.className = "de-slider-ends";
    const low = document.createElement("span");
    const high = document.createElement("span");
    ends.append(low, high);
    let bounds = sliderRange(parameter, number.valueAsNumber);
    const sync = () => {
      const value = model().parameters[parameter.key];
      slider.value = sliderPosition(value, bounds, parameter.slider.scale) * 1000;
      low.textContent = format(bounds[0]);
      high.textContent = format(bounds[1]);
      const label = name.value.trim() || parameter.label;
      number.setAttribute("aria-label", `${label} (${parameter.symbol})`);
      slider.setAttribute("aria-label", `${label} slider (${parameter.symbol})`);
      slider.setAttribute("aria-valuetext", `${format(value)}${parameter.slider.scale === "log" ? ", logarithmic slider" : ""}`);
    };
    number.addEventListener("input", () => {
      const valid = validParameter(parameter, number.valueAsNumber);
      number.setCustomValidity(valid ? "" : parameter.exclusiveMin ? `Enter a value greater than ${parameter.min}.` : "Enter a valid number.");
      number.setAttribute("aria-invalid", String(!valid));
      if (!valid) return;
      model().parameters[parameter.key] = number.valueAsNumber;
      bounds = sliderRange(parameter, number.valueAsNumber);
      sync();
      schedule();
    });
    number.addEventListener("blur", () => number.reportValidity());
    slider.addEventListener("input", () => {
      const value = sliderValue(slider.valueAsNumber / 1000, bounds, parameter.slider.scale);
      model().parameters[parameter.key] = value;
      number.value = value;
      number.setCustomValidity("");
      number.setAttribute("aria-invalid", "false");
      sync();
      schedule();
    });
    name.addEventListener("input", () => {
      model().labels[parameter.key] = name.value;
      sync();
      save();
    });
    name.addEventListener("blur", () => {
      if (!name.value.trim()) { name.value = parameter.label; delete model().labels[parameter.key]; sync(); save(); }
    });
    sync();
    top.append(symbol, name, number);
    row.append(top, slider, ends);
    element("parameters").append(row);
  }
  element("math").hidden = !distribution.formula;
  element("formula").textContent = distribution.formula ? `\\(${distribution.formula}\\)` : "";
  element("parameterization").textContent = distribution.parameters.map(p => `${p.symbol}: ${p.label}${p.exclusiveMin ? " > 0" : ""}`).join(" · ");
  element("source").href = `https://github.com/carl-stone/carljstone.github.io/blob/master/assets/js/distributions/definitions/${distribution.id}.js`;
  typeset();
}

async function typeset() {
  if (!element("math").open || !window.MathJax?.typesetPromise) return;
  try {
    await window.MathJax.startup?.promise;
    window.MathJax.typesetClear?.([element("formula")]);
    await window.MathJax.typesetPromise([element("formula")]);
  } catch { /* The formula remains readable if the optional math renderer fails. */ }
}

function renderStatistics(distribution, parameters) {
  const moments = distribution.moments?.(parameters) ?? {};
  const quantile = u => distribution.quantile?.(u, parameters);
  const values = [["Mean", moments.mean], ["Median", quantile(0.5)], ["Std. deviation", moments.sd], ["95th percentile", quantile(0.95)]];
  element("statistics").replaceChildren(...values.map(([label, value]) => {
    const group = document.createElement("div");
    const term = document.createElement("dt");
    const result = document.createElement("dd");
    term.textContent = label;
    result.textContent = format(value);
    group.append(term, result);
    return group;
  }));
  const [lo, hi] = distribution.support?.(parameters) ?? [-Infinity, Infinity];
  element("support").textContent = `Support: ${format(lo)} < ${state.variable.trim() || "x"} < ${format(hi)}.`;
}

function bindPlotEvents() {
  if (plotEventsBound) return;
  plotEventsBound = true;
  plot.on("plotly_relayout", event => {
    if (rendering) return;
    if (event["xaxis.autorange"]) {
      state.range = null;
      syncSettings();
      schedule();
    } else {
      const range = event["xaxis.range"] ?? (event["xaxis.range[0]"] !== undefined ? [event["xaxis.range[0]"], event["xaxis.range[1]"]] : null);
      if (!range) return;
      const converted = state.logX ? range.map(x => 10 ** x) : range;
      if (converted.every(Number.isFinite) && converted[1] > converted[0]) {
        state.range = converted;
        syncSettings();
        schedule();
      }
    }
  });
}

async function render() {
  if (rendering) { dirty = true; return; }
  rendering = true;
  try {
    const distribution = current();
    const parameters = model().parameters;
    const key = JSON.stringify([state.id, parameters, state.count, state.seed]);
    if (key !== sampleCache.key) sampleCache = { key, values: sampleDistribution(distribution, parameters, state.count, state.seed) };
    const domain = state.range ?? defaultRange(distribution, parameters, sampleCache.values, state.logX);
    const bars = histogram(sampleCache.values, domain, state.bins, state.logX);
    const curve = densityCurve(distribution, parameters, domain, state.logX);
    lastDomain = domain;
    const dark = document.documentElement.dataset.theme === "dark";
    const ink = getComputedStyle(element("workspace")).color;
    const traces = [];
    if (state.showHistogram) traces.push({
      type: "bar", name: "Samples", x: bars.x, y: bars.y.map(y => state.logY && y === 0 ? null : y), width: bars.widths,
      marker: { color: dark ? "rgba(215,164,92,.40)" : "rgba(215,164,92,.38)", line: { color: "#c68c46", width: 0.6 } },
      customdata: bars.counts,
      hovertemplate: "x: %{x:.5g}<br>Density: %{y:.5g}<br>%{customdata} samples<extra>Samples</extra>",
    });
    if (state.showDensity) traces.push({
      type: "scatter", mode: "lines", name: "Density", x: curve.x, y: curve.y.map(y => state.logY && y === 0 ? null : y),
      line: { color: dark ? "#7bc8c0" : "#176c69", width: 2.5 },
      hovertemplate: "x: %{x:.5g}<br>Density: %{y:.5g}<extra>Theoretical</extra>",
      connectgaps: false,
    });
    const ymax = Math.max(state.showDensity ? curve.suggestedMax : 0, state.showHistogram ? Math.max(...bars.y.filter(Number.isFinite)) : 0);
    if (!(ymax > 0) || !Number.isFinite(ymax)) throw new Error("This range has no plottable density. Choose Fit range or adjust the parameters.");
    const layout = {
      autosize: true, showlegend: false, bargap: 0, hovermode: "closest", dragmode: "zoom",
      margin: { l: 66, r: 16, t: 25, b: 55 },
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "inherit", size: 12, color: ink },
      xaxis: { title: { text: text(state.variable.trim() || "x"), standoff: 12 }, type: state.logX ? "log" : "linear", range: state.logX ? domain.map(Math.log10) : domain,
        gridcolor: dark ? "#354049" : "#e9eeee", zerolinecolor: dark ? "#52616a" : "#bbc8cc", tickformat: ".4~g", automargin: true },
      yaxis: { title: { text: "Probability density", standoff: 10 }, type: state.logY ? "log" : "linear",
        range: state.logY ? [Math.log10(ymax) - 5, Math.log10(ymax) + 0.12] : [0, ymax * 1.12],
        gridcolor: dark ? "#354049" : "#e9eeee", zeroline: false, tickformat: ".3~g", automargin: true },
    };
    await window.Plotly.react(plot, traces, layout, { responsive: true, displaylogo: false, scrollZoom: false,
      modeBarButtonsToRemove: ["select2d", "lasso2d"], toImageButtonOptions: { filename: `${state.id}-distribution`, scale: 2 } });
    bindPlotEvents();
    element("x-min").value = Number(domain[0].toPrecision(8));
    element("x-max").value = Number(domain[1].toPrecision(8));
    const probability = distribution.cdf ? Math.max(0, Math.min(1, distribution.cdf(domain[1], parameters) - distribution.cdf(domain[0], parameters))) : null;
    const notes = [];
    if (probability !== null && Number.isFinite(probability)) notes.push(`${(100 * probability).toLocaleString("en-US", { maximumFractionDigits: 2 })}% of probability in view`);
    if (state.showHistogram) notes.push(`${bars.outside.toLocaleString()} of ${state.count.toLocaleString()} samples outside view`);
    if (bars.nonfinite) notes.push(`${bars.nonfinite.toLocaleString()} samples exceed numerical range`);
    element("plot-note").textContent = notes.join(" · ");
    plot.setAttribute("aria-label", `${distribution.name} distribution. ${element("plot-note").textContent}.`);
    renderStatistics(distribution, parameters);
    error.hidden = true;
  } catch (issue) {
    // A failed update must not leave the previous distribution masquerading as
    // the newly selected one.
    if (window.Plotly && plot.data) window.Plotly.purge(plot);
    plotEventsBound = false;
    element("statistics").replaceChildren();
    element("plot-note").textContent = "";
    error.textContent = issue.message || "These parameters could not be plotted. Try resetting the parameters.";
    error.hidden = false;
  } finally {
    rendering = false;
    if (dirty) { dirty = false; schedule(); }
  }
}

for (const distribution of distributions) {
  const option = document.createElement("option");
  option.value = distribution.id;
  option.textContent = distribution.name;
  element("distribution").append(option);
}

element("distribution").addEventListener("change", () => {
  state.id = element("distribution").value;
  state.range = null;
  if ((current().support?.(model().parameters)?.[0] ?? -Infinity) < 0) state.logX = false;
  syncSettings();
  buildParameters();
  schedule();
});

element("reset").addEventListener("click", () => {
  state.models[state.id] = { parameters: defaults(current()), labels: {} };
  state.range = null;
  syncSettings();
  buildParameters();
  schedule();
});

for (const key of ["count", "bins", "seed"]) {
  const input = element(key);
  input.addEventListener("input", () => {
    const value = input.valueAsNumber;
    const valid = Number.isInteger(value) && value >= Number(input.min) && value <= Number(input.max);
    input.setCustomValidity(valid ? "" : `Enter a whole number from ${input.min} to ${input.max}.`);
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid) return;
    state[key] = value;
    schedule();
  });
  input.addEventListener("blur", () => input.reportValidity());
}

element("resample").addEventListener("click", () => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  state.seed = value[0];
  element("seed").value = state.seed;
  schedule();
});

for (const [id, key] of [["log-x", "logX"], ["log-y", "logY"], ["show-density", "showDensity"], ["show-histogram", "showHistogram"]]) {
  element(id).addEventListener("change", () => {
    state[key] = element(id).checked;
    if (!state.showDensity && !state.showHistogram) {
      state[id === "show-density" ? "showHistogram" : "showDensity"] = true;
    }
    if (id === "log-x" && state.logX && state.range?.[0] <= 0) state.range = null;
    syncSettings();
    schedule();
  });
}

element("variable").addEventListener("input", () => { state.variable = element("variable").value; schedule(); });
element("lock-range").addEventListener("change", () => { state.range = element("lock-range").checked ? lastDomain : null; schedule(); });
element("fit").addEventListener("click", () => { state.range = null; syncSettings(); schedule(); });
element("apply-range").addEventListener("click", () => {
  const min = element("x-min");
  const max = element("x-max");
  const valid = Number.isFinite(min.valueAsNumber) && Number.isFinite(max.valueAsNumber) && max.valueAsNumber > min.valueAsNumber && (!state.logX || min.valueAsNumber > 0);
  max.setCustomValidity(valid ? "" : state.logX ? "Enter an increasing range with a positive minimum." : "The maximum must be greater than the minimum.");
  if (!min.reportValidity() || !max.reportValidity()) return;
  state.range = [min.valueAsNumber, max.valueAsNumber];
  syncSettings();
  schedule();
});
for (const id of ["x-min", "x-max"]) element(id).addEventListener("input", () => element("x-max").setCustomValidity(""));

element("copy").addEventListener("click", async () => {
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ config: JSON.stringify(shareState(state)) }).toString();
  history.replaceState(null, "", url);
  try {
    await navigator.clipboard.writeText(url.href);
    status.textContent = "Link copied, including parameters, names, and sample seed.";
  } catch {
    const input = document.createElement("input");
    input.type = "text";
    input.value = url.href;
    input.readOnly = true;
    input.setAttribute("aria-label", "Link to these distribution settings");
    status.replaceChildren("Copy this link: ", input);
    input.focus();
    input.select();
  }
});

element("math").addEventListener("toggle", typeset);
document.getElementById("MathJax-script")?.addEventListener("load", typeset);
new MutationObserver(() => schedule()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
window.addEventListener("hashchange", () => {
  const linked = new URLSearchParams(location.hash.slice(1)).get("config");
  if (!linked) return;
  try {
    state = restoreState(JSON.parse(linked));
    syncSettings();
    buildParameters();
    schedule();
  } catch { status.textContent = "This link's settings could not be read."; }
});

async function start() {
  if (!window.Plotly) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("The chart library could not load. Reload the page to try again.")), 15000);
      const script = document.getElementById("de-plotly");
      script.addEventListener("load", () => { clearTimeout(timer); resolve(); }, { once: true });
      script.addEventListener("error", () => { clearTimeout(timer); reject(new Error("The chart library could not load. Reload the page to try again.")); }, { once: true });
    });
  }
  syncSettings();
  buildParameters();
  element("loading").hidden = true;
  element("workspace").hidden = false;
  await render();
}

start().catch(issue => { element("loading").textContent = issue.message; });
