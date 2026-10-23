import { distributions, distributionById, defaults, validParameter } from "./registry.js";

export const STORAGE_KEY = "distribution-explorer:v1";

export function initialState() {
  return {
    id: "gb2", count: 2000, bins: 40, seed: 42,
    logX: false, logY: false, showDensity: true, showHistogram: true,
    range: null, variable: "x",
    models: Object.fromEntries(distributions.map(d => [d.id, { parameters: defaults(d), labels: {} }])),
  };
}

export function restoreState(raw) {
  const state = initialState();
  if (!raw || typeof raw !== "object") return state;
  if (distributionById.has(raw.id)) state.id = raw.id;
  for (const [key, min, max] of [["count", 10, 50000], ["bins", 5, 200], ["seed", 0, 4294967295]]) {
    if (Number.isInteger(raw[key]) && raw[key] >= min && raw[key] <= max) state[key] = raw[key];
  }
  for (const key of ["logX", "logY", "showDensity", "showHistogram"]) {
    if (typeof raw[key] === "boolean") state[key] = raw[key];
  }
  if (!state.showDensity && !state.showHistogram) state.showDensity = true;
  if (typeof raw.variable === "string") state.variable = raw.variable.slice(0, 60);
  for (const d of distributions) {
    const model = raw.models?.[d.id];
    for (const p of d.parameters) {
      if (validParameter(p, model?.parameters?.[p.key])) state.models[d.id].parameters[p.key] = model.parameters[p.key];
      if (typeof model?.labels?.[p.key] === "string") state.models[d.id].labels[p.key] = model.labels[p.key].slice(0, 64);
    }
  }
  const support = distributionById.get(state.id).support?.(state.models[state.id].parameters);
  if (support?.[0] < 0) state.logX = false;
  if (Array.isArray(raw.range) && raw.range.length === 2 && raw.range.every(Number.isFinite)
      && raw.range[1] > raw.range[0] && (!state.logX || raw.range[0] > 0)) state.range = [...raw.range];
  return state;
}

export function shareState(state) {
  return { ...state, models: { [state.id]: state.models[state.id] } };
}
