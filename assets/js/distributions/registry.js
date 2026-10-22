import normal from "./definitions/normal.js";
import beta from "./definitions/beta.js";
import gamma from "./definitions/gamma.js";
import lognormal from "./definitions/lognormal.js";
import gb2 from "./definitions/gb2.js";
import studentT from "./definitions/student-t.js";

// Add a definition here to make it appear in the dropdown. Controls and plots
// are generated from the definition; adding a distribution needs no UI edits.
export const distributions = [normal, beta, gamma, lognormal, gb2, studentT];
export const distributionById = new Map(distributions.map(d => [d.id, d]));

export function defaults(distribution) {
  return Object.fromEntries(distribution.parameters.map(p => [p.key, p.default]));
}

export function validParameter(parameter, value) {
  return Number.isFinite(value)
    && (parameter.min === undefined || (parameter.exclusiveMin ? value > parameter.min : value >= parameter.min))
    && (parameter.max === undefined || value <= parameter.max);
}

export function density(distribution, x, parameters) {
  return distribution.logPdf ? Math.exp(distribution.logPdf(x, parameters)) : distribution.pdf(x, parameters);
}
