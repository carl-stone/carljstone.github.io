import stats from "./lib/jstat.js";

export { stats };
export const logGamma = stats.gammaln;
export const logBeta = stats.betaln;
export const LOG_SQRT_2PI = Math.log(2 * Math.PI) / 2;

export function softplus(x) {
  return Math.max(0, x) + Math.log1p(Math.exp(-Math.abs(x)));
}

export function logistic(x) {
  return x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
}

export function betaCdfFromLog(logX, a, b) {
  const x = Math.exp(logX);
  // I_x(a,b) approaches x^a / (a B(a,b)) at zero. Keep the power in log
  // space when its correction is negligible, even if x itself underflows.
  if (x < Number.EPSILON && Math.abs(b - 1) * x < Number.EPSILON) {
    return Math.exp(a * logX - Math.log(a) - logBeta(a, b));
  }
  return stats.beta.cdf(x, a, b);
}

// Mulberry32. The open interval also keeps logarithms in samplers finite.
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296 + 0.5 / 4294967296;
  };
}

export function normalSample(random) {
  return Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
}

// Marsaglia–Tsang gamma sampling. Keeping draws in log space also lets GB2
// form a gamma ratio without rounding a beta draw to exactly one.
export function logGammaSample(shape, random) {
  if (shape < 1) return logGammaSample(shape + 1, random) + Math.log(random()) / shape;
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = normalSample(random);
    const base = 1 + c * x;
    if (base <= 0) continue;
    const v = base ** 3;
    const u = random();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < x * x / 2 + d * (1 - v + Math.log(v))) {
      return Math.log(d) + Math.log(v);
    }
  }
}

export function betaSample(alpha, beta, random) {
  return logistic(logGammaSample(alpha, random) - logGammaSample(beta, random));
}

export function betaLogOddsQuantile(probability, p, q) {
  const z = stats.beta.inv(probability, p, q);
  if (z <= 0.5) return Math.log(z) - Math.log1p(-z);
  const complement = stats.beta.inv(1 - probability, q, p);
  return Math.log1p(-complement) - Math.log(complement);
}

// Slider ranges are suggestions; typed values may extend them. Mathematical
// bounds stay separate so a positive parameter can never slide through zero.
export function positive(key, symbol, label, value, min = 0.1, max = 10, description = "") {
  return { key, symbol, label, default: value, min: 0, exclusiveMin: true,
    slider: { min, max, scale: "log" }, description };
}

export function real(key, symbol, label, value, min = -5, max = 5, description = "") {
  return { key, symbol, label, default: value, slider: { min, max, scale: "linear" }, description };
}
