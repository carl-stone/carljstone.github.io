import { logGamma, logGammaSample, positive, stats } from "../math.js";

export default {
  id: "gamma",
  name: "Gamma",
  description: "A positive distribution with adjustable skew. This version uses shape and scale (scale is the reciprocal of rate).",
  formula: String.raw`f(x)=\frac{x^{k-1}e^{-x/\theta}}{\Gamma(k)\theta^k},\quad x>0`,
  parameters: [
    positive("shape", "k", "Shape", 2, 0.1, 20),
    positive("scale", "θ", "Scale", 1, 0.1, 10),
  ],
  support: () => [0, Infinity],
  mode: ({ shape, scale }) => Math.max(0, (shape - 1) * scale),
  logPdf(x, { shape, scale }) {
    if (x < 0) return -Infinity;
    if (x === 0) return shape < 1 ? Infinity : shape > 1 ? -Infinity : -Math.log(scale);
    return (shape - 1) * (Math.log(x) - Math.log(scale)) - x / scale - logGamma(shape) - Math.log(scale);
  },
  sample: ({ shape, scale }, random) => Math.exp(Math.log(scale) + logGammaSample(shape, random)),
  cdf: (x, { shape, scale }) => x <= 0 ? 0 : stats.gamma.cdf(x, shape, scale),
  quantile: (u, { shape, scale }) => stats.gamma.inv(u, shape, scale),
  moments: ({ shape, scale }) => ({ mean: shape * scale, sd: Math.sqrt(shape) * scale }),
};
