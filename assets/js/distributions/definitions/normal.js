import { LOG_SQRT_2PI, normalSample, positive, real, stats } from "../math.js";

export default {
  id: "normal",
  name: "Normal",
  description: "A symmetric bell curve. Location moves its center; standard deviation changes its spread.",
  formula: String.raw`f(x)=\frac{1}{\sigma\sqrt{2\pi}}\exp\left[-\frac{(x-\mu)^2}{2\sigma^2}\right]`,
  parameters: [
    real("mu", "μ", "Mean", 0),
    positive("sigma", "σ", "Standard deviation", 1, 0.1, 5),
  ],
  support: () => [-Infinity, Infinity],
  mode: ({ mu }) => mu,
  logPdf: (x, { mu, sigma }) => -0.5 * ((x - mu) / sigma) ** 2 - Math.log(sigma) - LOG_SQRT_2PI,
  sample: ({ mu, sigma }, random) => mu + sigma * normalSample(random),
  cdf: (x, { mu, sigma }) => stats.normal.cdf(x, mu, sigma),
  quantile: (u, { mu, sigma }) => u === 0.5 ? mu : stats.normal.inv(u, mu, sigma),
  moments: ({ mu, sigma }) => ({ mean: mu, sd: sigma }),
};
