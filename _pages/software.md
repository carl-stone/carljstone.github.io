---
layout: single
title: "Software"
permalink: /software/
---

## Distributor

[Explore probability distributions]({{ '/distributions/' | relative_url }}) with editable parameter sliders, theoretical densities, and sampled histograms. Includes normal, beta, gamma, lognormal, GB2, and Student-t distributions. Rename parameters for the problem at hand and share a link to the current settings.

## commaKit

**commaKit** (*Comparative Microbial Methylomics Analysis Kit*; FKA CoMMA) is an R/Bioconductor-style package for comparative microbial methylomics from nanopore modification calls.

It was built because no adequate tool existed for per-site methylation analysis in bacteria — existing approaches were bulk-level or designed for eukaryotic CpG methylation. commaKit was developed alongside the *mBio* 2023 paper, then substantially rewritten around Bioconductor genomic data structures, formal S4 classes, testthat validation, roxygen2 documentation, vignettes, and pkgdown documentation. **Bioconductor submission is planned.**

A companion methods paper is in preparation for *Microbial Resource Announcements* (Stone CJ, first author).

### Links

- **GitHub:** [github.com/carl-stone/comma](https://github.com/carl-stone/comma)
- **Documentation:** [carl-stone.github.io/comma](https://carl-stone.github.io/comma/)

### What it does

commaKit provides a tidy, end-to-end workflow for:

- Importing per-site methylation calls from long-read sequencers, especially nanopore/modkit-style workflows
- Representing methylation sites with Bioconductor genomic ranges and S4 classes
- Performing differential methylation analysis across conditions, modification types, and modification contexts
- Annotating sites, testing enrichment, generating QC summaries, visualizing results, and exporting BED-compatible tracks

### Installation

```r
# Install from GitHub (current)
if (!requireNamespace("remotes", quietly = TRUE))
  install.packages("remotes")
remotes::install_github("carl-stone/comma")

# Bioconductor submission is planned
# BiocManager::install("commaKit")
```

### Citation

If you use commaKit, please cite:

> Stone CJ, Boyer GF, Behringer MG. 2023. Differential adenine methylation analysis reveals increased variability in 6mA in the absence of methyl-directed mismatch repair. *mBio* **14**, e01289-23. [https://doi.org/10.1128/mbio.01289-23](https://doi.org/10.1128/mbio.01289-23)
