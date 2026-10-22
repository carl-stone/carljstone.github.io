import { betaLogOddsQuantile, logBeta, logGammaSample, logistic, positive, softplus, stats } from "../math.js";

export default {
  id: "gb2",
  name: "GB2",
  description: "Generalized beta of the second kind. A positive distribution with three shape parameters and a scale, able to produce long right tails.",
  formula: String.raw`f(x)=\frac{a(x/b)^{ap-1}}{bB(p,q)\left[1+(x/b)^a\right]^{p+q}},\quad x>0`,
  parameters: [
    positive("a", "a", "Shape a", 2, 0.2, 10, "Changes the power used to transform the underlying beta-prime variable."),
    positive("b", "b", "Scale", 1, 0.1, 10, "Multiplying b multiplies every quantile by the same amount."),
    positive("p", "p", "Shape p", 2, 0.1, 10, "Together, a × p controls behavior near zero."),
    positive("q", "q", "Shape q", 3, 0.1, 10, "Together, a × q controls the right tail; smaller values give heavier tails."),
  ],
  support: () => [0, Infinity],
  logPdf(x, { a, b, p, q }) {
    if (x < 0) return -Infinity;
    if (x === 0) return a * p < 1 ? Infinity : a * p > 1 ? -Infinity : Math.log(a) - Math.log(b) - logBeta(p, q);
    const t = a * (Math.log(x) - Math.log(b));
    return Math.log(a) - Math.log(x) - logBeta(p, q) - p * softplus(-t) - q * softplus(t);
  },
  sample: ({ a, b, p, q }, random) => Math.exp(Math.log(b) + (logGammaSample(p, random) - logGammaSample(q, random)) / a),
  cdf: (x, { a, b, p, q }) => x <= 0 ? 0 : stats.beta.cdf(logistic(a * (Math.log(x) - Math.log(b))), p, q),
  quantile: (u, { a, b, p, q }) => Math.exp(Math.log(b) + betaLogOddsQuantile(u, p, q) / a),
  moments({ a, b, p, q }) {
    const base = logBeta(p, q);
    const mean = a * q > 1 ? Math.exp(Math.log(b) + logBeta(p + 1 / a, q - 1 / a) - base) : Infinity;
    const second = a * q > 2 ? Math.exp(2 * Math.log(b) + logBeta(p + 2 / a, q - 2 / a) - base) : Infinity;
    return { mean, sd: mean === Infinity ? null : Math.sqrt(Math.max(0, second - mean * mean)) };
  },
};
