---
layout: single
title: "Software"
permalink: /software/
---

## commaKit

**commaKit** is an R package for differential bacterial DNA methylation analysis.

It was built because no adequate tool existed for per-site methylation analysis in bacteria — existing approaches were bulk-level or designed for eukaryotic CpG methylation. commaKit was developed alongside the *mBio* 2023 paper, then substantially rewritten with full test coverage, comprehensive vignettes, and pkgdown documentation. **Bioconductor submission is pending.**

A companion methods paper is in preparation for *Microbial Resource Announcements* (Stone CJ, first author).

### Links

- **GitHub:** [github.com/carl-stone/comma](https://github.com/carl-stone/comma)
- **Documentation:** [carl-stone.github.io/comma](https://carl-stone.github.io/comma/)

### What it does

commaKit provides a tidy, end-to-end workflow for:

- Importing per-site methylation calls from long-read sequencers (Nanopore, PacBio)
- Normalizing and aggregating site-level methylation fractions
- Performing differential methylation analysis across conditions or timepoints
- Visualizing methylation distributions, genomic context, and statistical results

### Installation

```r
# Install from GitHub (current)
if (!requireNamespace("remotes", quietly = TRUE))
  install.packages("remotes")
remotes::install_github("carl-stone/comma")

# Bioconductor (pending submission)
# BiocManager::install("commaKit")
```

### Citation

If you use commaKit, please cite:

> Stone CJ, Boyer GF, Behringer MG. 2023. Differential adenine methylation analysis reveals increased variability in 6mA in the absence of methyl-directed mismatch repair. *mBio* **14**, e01289-23. [https://doi.org/10.1128/mbio.01289-23](https://doi.org/10.1128/mbio.01289-23)
