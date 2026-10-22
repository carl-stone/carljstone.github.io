import { betaSample, logBeta, positive, stats } from "../math.js";

export default {
  id: "beta",
  name: "Beta",
  description: "A distribution between zero and one. The two shape parameters can make it symmetric, skewed, or U-shaped.",
  formula: String.raw`f(x)=\frac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha,\beta)},\quad 0<x<1`,
  parameters: [
    positive("alpha", "α", "Shape α", 2, 0.1, 20),
    positive("beta", "β", "Shape β", 5, 0.1, 20),
  ],
  support: () => [0, 1],
  logPdf(x, { alpha, beta }) {
    if (x < 0 || x > 1) return -Infinity;
    if (x === 0) return alpha < 1 ? Infinity : alpha > 1 ? -Infinity : Math.log(beta);
    if (x === 1) return beta < 1 ? Infinity : beta > 1 ? -Infinity : Math.log(alpha);
    return (alpha - 1) * Math.log(x) + (beta - 1) * Math.log1p(-x) - logBeta(alpha, beta);
  },
  sample: ({ alpha, beta }, random) => betaSample(alpha, beta, random),
  cdf: (x, { alpha, beta }) => x <= 0 ? 0 : x >= 1 ? 1 : stats.beta.cdf(x, alpha, beta),
  quantile: (u, { alpha, beta }) => stats.beta.inv(u, alpha, beta),
  moments: ({ alpha: a, beta: b }) => ({ mean: a / (a + b), sd: Math.sqrt(a * b / ((a + b) ** 2 * (a + b + 1))) }),
};
