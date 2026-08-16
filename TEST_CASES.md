# Verification Test Cases

This document describes verification cases used during development of the
Mechanical Tolerance Analyzer.

The purpose of these tests is to verify the calculation logic for tolerance
stack-up analysis under controlled input conditions.

The tests cover:

- Worst Case analysis
- Root Sum Square (RSS) analysis
- Positive and negative stack directions
- Symmetric and asymmetric tolerances
- Target margin evaluation
- PASS / FAIL evaluation
- Statistical analysis
- Component contribution calculations

> These tests verify the implemented calculation logic using controlled
> examples. They do not constitute certification of the software for
> production or safety-critical use.


## Test 1 — Additive tolerance stack

### Purpose

Verify a basic tolerance chain where all component dimensions contribute in
the positive direction.

### Input

Target:

| Parameter | Value |
|---|---:|
| Nominal | 100 mm |
| Upper deviation | +1.0 mm |
| Lower deviation | -1.0 mm |

Components:

| Component | Nominal | Upper deviation | Lower deviation | Direction |
|---|---:|---:|---:|:---:|
| A | 40 mm | +0.2 mm | -0.2 mm | + |
| B | 35 mm | +0.3 mm | -0.3 mm | + |
| C | 25 mm | +0.1 mm | -0.1 mm | + |

### Expected result

Nominal stack:

40 + 35 + 25 = 100 mm

Worst Case minimum:

100 - 0.2 - 0.3 - 0.1 = 99.4 mm

Worst Case maximum:

100 + 0.2 + 0.3 + 0.1 = 100.6 mm

Total Worst Case tolerance:

1.2 mm

RSS:

sqrt(0.2² + 0.3² + 0.1²) ≈ 0.374 mm

Expected:

- Worst Case: PASS
- RSS: PASS


## Test 2 — Subtractive tolerance stack

### Purpose

Verify that dimensions with negative stack direction are handled correctly.

### Input

Target:

| Parameter | Value |
|---|---:|
| Nominal | 20 mm |
| Upper deviation | +0.5 mm |
| Lower deviation | -0.5 mm |

Components:

| Component | Nominal | Upper deviation | Lower deviation | Direction |
|---|---:|---:|---:|:---:|
| A | 100 mm | +0.2 mm | -0.2 mm | + |
| B | 50 mm | +0.1 mm | -0.1 mm | - |
| C | 30 mm | +0.1 mm | -0.1 mm | - |

### Expected result

Nominal stack:

100 - 50 - 30 = 20 mm

Worst Case minimum:

19.6 mm

Worst Case maximum:

20.4 mm

Total Worst Case tolerance:

0.8 mm

RSS:

sqrt(0.2² + 0.1² + 0.1²) ≈ 0.245 mm

Expected:

- Worst Case: PASS
- RSS: PASS


## Test 3 — Mixed positive and negative directions

### Purpose

Verify a tolerance chain containing both positive and negative contributors.

### Input

Target:

| Parameter | Value |
|---|---:|
| Nominal | 60 mm |
| Upper deviation | +0.8 mm |
| Lower deviation | -0.8 mm |

Components:

| Component | Nominal | Upper deviation | Lower deviation | Direction |
|---|---:|---:|---:|:---:|
| A | 100 mm | +0.2 mm | -0.2 mm | + |
| B | 30 mm | +0.3 mm | -0.3 mm | - |
| C | 70 mm | +0.1 mm | -0.1 mm | - |

### Expected result

Nominal stack:

100 + 30 - 70 = 60 mm

Worst Case minimum:

59.4 mm

Worst Case maximum:

60.6 mm

Total Worst Case tolerance:

1.2 mm

RSS:

sqrt(0.2² + 0.3² + 0.1²) ≈ 0.374 mm

Expected:

- Worst Case: PASS
- RSS: PASS


## Test 4 — Asymmetric tolerances

### Purpose

Verify that asymmetric upper and lower deviations are propagated correctly.

### Input

Target:

| Parameter | Value |
|---|---:|
| Nominal | 30 mm |
| Upper deviation | +0.8 mm |
| Lower deviation | -0.4 mm |

Components:

| Component | Nominal | Upper deviation | Lower deviation | Direction |
|---|---:|---:|---:|:---:|
| A | 100 mm | +0.3 mm | -0.1 mm | + |
| B | 70 mm | +0.2 mm | -0.4 mm | - |

### Expected result

Nominal stack:

100 - 70 = 30 mm

Worst Case minimum:

29.7 mm

Worst Case maximum:

30.7 mm

Expected margins:

- Lower margin: 0.1 mm
- Upper margin: 0.1 mm
- Critical margin: 0.1 mm

Expected:

- Worst Case: PASS


## Test 5 — Worst Case FAIL / RSS PASS

### Purpose

Verify that Worst Case and RSS are evaluated independently.

This test represents a tolerance chain where the complete Worst Case range
exceeds the target limits while the RSS result remains within them.

### Input

Target:

| Parameter | Value |
|---|---:|
| Nominal | 100 mm |
| Upper deviation | +0.3 mm |
| Lower deviation | -0.3 mm |

Components:

| Component | Nominal | Upper deviation | Lower deviation | Direction |
|---|---:|---:|---:|:---:|
| A | 60 mm | +0.2 mm | -0.2 mm | + |
| B | 40 mm | +0.2 mm | -0.2 mm | + |

### Expected result

Nominal stack:

60 + 40 = 100 mm

Worst Case range:

99.6 mm to 100.4 mm

Worst Case critical margin:

-0.1 mm

RSS:

sqrt(0.2² + 0.2²) ≈ 0.283 mm

RSS range:

approximately 99.717 mm to 100.283 mm

RSS critical margin:

approximately +0.017 mm

Expected:

- Worst Case: FAIL
- RSS: PASS


## Test 6 — Statistical analysis using known sigma

### Purpose

Verify statistical stack calculation when component process standard
deviations are supplied directly.

### Input

Nominal stack:

100 mm

Component standard deviations:

| Component | σ |
|---|---:|
| A | 0.100 mm |
| B | 0.050 mm |

### Expected result

Combined stack standard deviation:

sqrt(0.100² + 0.050²)

≈ 0.111803 mm

3σ range:

3 × 0.111803

≈ 0.33541 mm

Statistical stack range:

approximately:

99.66459 mm to 100.33541 mm

Variance contributions:

A:

0.100² / (0.100² + 0.050²) = 80%

B:

0.050² / (0.100² + 0.050²) = 20%

Expected:

- Stack σ ≈ 0.111803 mm
- A variance contribution = 80%
- B variance contribution = 20%


## Test 7 — Component contribution ranking

### Purpose

Verify that the analyzer correctly identifies the largest tolerance
contributor.

### Input

| Component | Total tolerance |
|---|---:|
| A | 0.4 mm |
| B | 0.6 mm |
| C | 0.2 mm |

Total Worst Case tolerance:

1.2 mm

### Expected result

Worst Case contributions:

- A: 33.3%
- B: 50.0%
- C: 16.7%

Critical component:

B

For RSS analysis, the component with the largest squared tolerance
contribution should also be identified as the critical RSS contributor.


## Verification status

The controlled cases above were manually compared with the results produced
by the Mechanical Tolerance Analyzer.

| Test | Verification |
|---|:---:|
| Additive stack | PASS |
| Subtractive stack | PASS |
| Mixed directions | PASS |
| Asymmetric tolerances | PASS |
| Worst Case FAIL / RSS PASS | PASS |
| Statistical known-sigma calculation | PASS |
| Contribution ranking | PASS |

Additional verification cases may be added as the project develops.
