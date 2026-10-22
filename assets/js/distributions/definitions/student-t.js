import { logGamma, logGammaSample, normalSample, positive, real, stats } from "../math.js";

export default {
  id: "student-t",
  name: "Student-t",
  description: "A symmetric distribution with heavier tails than a normal. Lower degrees of freedom make the tails heavier; scale is not its standard deviation.",
  formula: String.raw`f(x)=\frac{\Gamma((\nu+1)/2)}{s\sqrt{\nu\pi}\,\Gamma(\nu/2)}\left[1+\frac{(x-\mu)^2}{\nu s^2}\right]^{-(\nu+1)/2}`,
  parameters: [
    positive("df", "ν", "Degrees of freedom", 5, 0.5, 100, "Any positive value is allowed, including non-integers. At ν = 1 this is a Cauchy distribution."),
    real("mu", "μ", "Location", 0),
    positive("scale", "s", "Scale", 1, 0.1, 5),
  ],
  support: () => [-Infinity, Infinity],
  mode: ({ mu }) => mu,
  logPdf: (x, { df, mu, scale }) => logGamma((df + 1) / 2) - logGamma(df / 2) - Math.log(scale) - Math.log(df * Math.PI) / 2 - (df + 1) / 2 * Math.log1p(((x - mu) / scale) ** 2 / df),
  sample({ df, mu, scale }, random) {
    const z = normalSample(random);
    const logDenominator = (Math.log(2 / df) + logGammaSample(df / 2, random)) / 2;
    return mu + scale * z * Math.exp(-logDenominator);
  },
  cdf: (x, { df, mu, scale }) => stats.studentt.cdf((x - mu) / scale, df),
  quantile: (u, { df, mu, scale }) => mu + scale * stats.studentt.inv(u, df),
  moments: ({ df, mu, scale }) => ({ mean: df > 1 ? mu : null, sd: df > 2 ? scale * Math.sqrt(df / (df - 2)) : df > 1 ? Infinity : null }),
};
