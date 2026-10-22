import { LOG_SQRT_2PI, normalSample, positive, real, stats } from "../math.js";

export default {
  id: "lognormal",
  name: "Lognormal",
  description: "A positive distribution whose logarithm is normal. Its parameters describe log(X), so μ is not the mean of X.",
  formula: String.raw`f(x)=\frac{1}{x\sigma\sqrt{2\pi}}\exp\left[-\frac{(\log x-\mu)^2}{2\sigma^2}\right],\quad x>0`,
  parameters: [
    real("mu", "μ", "Log mean", 0),
    positive("sigma", "σ", "Log standard deviation", 0.7, 0.1, 3),
  ],
  support: () => [0, Infinity],
  logPdf: (x, { mu, sigma }) => x <= 0 ? -Infinity : -Math.log(x) - Math.log(sigma) - LOG_SQRT_2PI - 0.5 * ((Math.log(x) - mu) / sigma) ** 2,
  sample: ({ mu, sigma }, random) => Math.exp(mu + sigma * normalSample(random)),
  cdf: (x, { mu, sigma }) => x <= 0 ? 0 : stats.normal.cdf(Math.log(x), mu, sigma),
  quantile: (u, { mu, sigma }) => Math.exp(stats.normal.inv(u, mu, sigma)),
  moments({ mu, sigma }) {
    const mean = Math.exp(mu + sigma * sigma / 2);
    return { mean, sd: mean * Math.sqrt(Math.expm1(sigma * sigma)) };
  },
};
