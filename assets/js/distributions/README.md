# Distribution explorer

The explorer at `/distributions/` is a Jekyll page with native JavaScript modules. It uses the existing site build. Plotly draws the charts; jStat 1.9.6 supplies special functions, CDFs, and inverse CDFs. jStat is vendored in `lib/` with its MIT license and an ES module wrapper.

## Add a distribution

Create one file in `definitions/`, then import it and add it to the array in `registry.js`. The dropdown and parameter controls are generated from that array.

For example, `definitions/exponential.js` could contain:

```js
import { positive } from "../math.js";

export default {
  id: "exponential",
  name: "Exponential",
  description: "A positive distribution parameterized by rate.",
  parameters: [positive("rate", "λ", "Rate", 1, 0.1, 10)],
  support: () => [0, Infinity],
  logPdf: (x, { rate }) => x < 0 ? -Infinity : Math.log(rate) - rate * x,
  sample: ({ rate }, random) => -Math.log(random()) / rate,
  cdf: (x, { rate }) => x <= 0 ? 0 : -Math.expm1(-rate * x),
  quantile: (u, { rate }) => -Math.log1p(-u) / rate,
  moments: ({ rate }) => ({ mean: 1 / rate, sd: 1 / rate }),
};
```

Then add `import exponential from "./definitions/exponential.js"` and append `exponential` to `distributions` in `registry.js`.

The definition supplies:

- `id`, `name`, `description`, and `parameters`.
- `logPdf(x, parameters)` or `pdf(x, parameters)`.
- `sample(parameters, random)`, returning one draw using the supplied seeded generator.
- `support(parameters)`, returning the lower and upper bounds; use `Infinity` for unbounded support.
- Optional `cdf`, `quantile`, `moments`, and a TeX `formula` string.

`quantile` gives a deterministic default plot range and percentile summaries. Without it, the range comes from the sampled values. `cdf` supplies the probability-in-view readout. Missing statistics display a dash; use `null` for undefined moments and `Infinity` for divergent ones.

`positive` and `real` in `math.js` create parameter metadata. Suggested slider ranges are separate from mathematical bounds: typing a value outside the slider range expands it. Positive sliders use logarithmic steps. For custom metadata, see those helpers; a parameter needs `key`, `symbol`, `label`, `default`, and `slider: { min, max, scale }`.

## Labels and sampling

Display labels never change mathematical parameter keys. Names and values are retained per distribution in the current tab's session. Copy link includes the current distribution, labels, values, variable name, seed, and view. It takes no account or server storage.

Histograms use density normalization with the full sample size in the denominator, including draws outside the viewing window. Logarithmic bins use their widths in the original x units. Log x changes the axis scale; the density is still for X, not for log(X).

## Development

From the repository root:

```sh
bundle exec jekyll serve --host 127.0.0.1 --port 4173
npm run test:distributions
```

Open `http://127.0.0.1:4173/distributions/`. Tests compare densities, CDFs, and quantiles against SciPy reference values, check sampler probabilities, and cover histogram normalization and saved settings. The site's existing JavaScript minification script is independent of these modules.
