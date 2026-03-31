---
layout: single
title: "Research"
permalink: /research/
---

My work asks how bacteria integrate molecular information across scales — from individual regulatory sites to genome-wide epigenetic patterns, from single growth curves to evolutionary trajectories spanning thousands of generations. I study this using high-throughput fitness assays, genome-scale methylation analysis, and Bayesian statistical modeling.

---

## The *E. coli* Dam Methylome

Dam methylase deposits N6-methyladenine (6mA) at GATC motifs throughout the *E. coli* genome. Bulk methylation approaches suggest near-complete modification, but I produced the most detailed per-site characterization of this methylome to date. Using long-read sequencing on experimental evolution lines, I identified 177 double-stranded GATC sites that are reproducibly hypomethylated — and found that these cluster specifically at regulatory DNA-protein interaction sites: −35 promoter elements, CRP/Fis/Fnr binding motifs, cryptic prophages, and IS elements. The absolute differences are small (~92% vs. 97%), but methylation state at a single promoter is binary, with well-documented phenotypic consequences in phase-variable regulatory systems.

I also characterized how methylation diverges in MMR-deficient evolved clones, finding hypomethylation at more sites, with greater variability and non-deterministic divergence, concentrated at sites already predisposed to low methylation. Together, this work reveals the *E. coli* methylome as spatially organized and functionally constrained, not merely a saturation artifact.

**Publication:** Stone CJ, Boyer GF, Behringer MG. 2023. Differential adenine methylation analysis reveals increased variability in 6mA in the absence of methyl-directed mismatch repair. *mBio* **14**, e01289-23. [Link](https://journals.asm.org/doi/10.1128/mbio.01289-23)

**Software:** [commaKit](/software/) — R package for differential methylation analysis, developed alongside this work

---

## Bayesian Longitudinal Fitness Analysis and the Fitness Seascape

Standard RB-TnSeq fitness assays compare two timepoints, collapsing temporal dynamics into a single endpoint estimate. I built a Bayesian hierarchical model (Stan/CmdStanR) for longitudinal Tn-Seq that estimates time-resolved selection rates across the full *E. coli* growth curve — from exponential growth through long-term stationary phase (0 → 1 → 4 → 10 days). The model uses piecewise linear regression on selection rates, partially pooled across ~15 insertion mutants per gene, with correlated interval coefficients. This makes uncertain estimates conservative while allowing confidently non-zero effects to pull away from zero.

Using this framework, I constructed an empirical one-dimensional fitness seascape: a latent phenotypic axis organizing ~3,000 transposon mutant genotypes, with an optimum that moves as an OU process over time. Key findings: (1) the long-term stationary phase optimum is closer to exponential growth than to death-phase tolerance, suggesting growth capacity is the predominant selection target in LTSP; (2) axis position maps onto a ~130-condition RB-TnSeq compendium, with one end representing near-neutral generalists and the other stress-tolerant but slow-growing alleles; (3) axis position predicts evolutionary arrival time in an independent LTEP — "growth" alleles fix ~50–100 days earlier.

**Preprint:** Stone CJ, Behringer MG. 2026. Bayesian analysis of longitudinal RB-TnSeq resolves the fitness seascape in fluctuating environments. *bioRxiv*. [Link](https://doi.org/10.64898/2026.02.11.703069) *(in review at Molecular Biology and Evolution)*

---

## commaKit — R Package for Bacterial Methylation Analysis

[commaKit](https://github.com/carl-stone/comma) is an R package for differential bacterial DNA methylation analysis, developed because no adequate tool existed for per-site 6mA analysis in bacteria. Built alongside the *mBio* 2023 paper, it has since been substantially rewritten with full test coverage, vignettes, and documentation. Bioconductor submission is pending; a companion methods paper is in preparation for *Microbial Resource Announcements*.

- GitHub: [carl-stone/comma](https://github.com/carl-stone/comma)
- Documentation: [carl-stone.github.io/comma](https://carl-stone.github.io/comma/)

---

## Earlier Work

**Virulence regulation in *Staphylococcus aureus* (Georgetown, 2018–2020).** As a research assistant in the Brinsmade Lab, I studied how branched-chain fatty acids modulate the Sae two-component system. Publications: [Pendleton et al., *mBio* 2022](https://doi.org/10.1128/mbio.01472-22); [Mlynek et al., *J. Bacteriology* 2020](https://doi.org/10.1128/jb.00593-19).

**Microbial ecology tools benchmarking (U. Minnesota, 2017–2018).** Undergraduate honors thesis comparing mothur, QIIME, and DADA2 on soil microbiome datasets. Also contributed to: [Behringer et al., *mBio* 2022](https://doi.org/10.1128/mbio.03467-21).
