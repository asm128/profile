# When library diagnostics become a test framework

A test framework normally supplies several things at once: assertions, test registration, parameterization, failure reporting, filtering, random generation and result aggregation. That bundle is convenient, but it can hide a more useful engineering question: which of those capabilities does a project actually lack?

LLC already had a signed-result convention, logging macros that preserve the failing expression and source location, compact containers and views, compile-time templates, and deterministic noise utilities. A small collection of tests showed that these facilities can compose into most of the testing system needed for LLC's foundational types. The result is not an argument that external test frameworks are universally unnecessary. It is a measured example of an existing library making a new dependency unnecessary for a specific job.

This article records the resulting design, its current metrics, comparisons with both conventional and strong third-party tests, and the capabilities that remain outside its scope.

## What is under test

The current `llc_test_core` executable contains four suites:

- `testViewBit()` validates mutable and const bit views, iterator positions, logical and storage ends, partial final elements, decrement, equality and proxy writes.
- `testPackedUInt()` validates the packed unsigned-integer representation across width bands, including its multiplier, tail, serialized width, byte view, round trip and input consumption.
- `testViewSerialize()` validates packed integer and view serialization, append behavior, cursor advancement, empty views, ownership, aliasing and truncated inputs.
- `testSPRNG()` validates the deterministic pseudorandom generator against the SplitMix64 reference sequence, including state tracking, reset and seed differentiation.

The type-dependent suites run against `u0_t`, `u1_t`, `u2_t` and `u3_t`. The test logic is written once as a function template and instantiated for all four backing widths. Value loops multiply it again across exact representation boundaries and deterministic pseudorandom inputs.

The fixed cases are important. Random generation is poor at finding narrow transitions by chance, so the packed-integer tests explicitly exercise each width band's minimum, an interior sample and maximum. View serialization explicitly covers counts `0`, `1`, `2`, `63`, `64`, `255`, `16383` and `16384`. Random inputs supplement those cases; they do not replace them.

## Measured size and executed coverage

The following measurements were taken from the working source on 2026-09-30. “Check sites” counts written uses of LLC's check-macro families. It is a source metric, not the number of times those checks execute.

| Source file | Lines | Nonblank lines | Check sites |
| --- | ---: | ---: | ---: |
| `llc_test_core.cpp` | 19 | 17 | 1 |
| `llc_test_noise.cpp` | 43 | 41 | 4 |
| `llc_test_packed_int.cpp` | 129 | 118 | 14 |
| `llc_test_view_bit.cpp` | 235 | 221 | 21 |
| `llc_test_view_serialize.cpp` | 307 | 290 | 32 |
| **Total** | **733** | **687** | **72** |

The nine-line declaration header is not included in that table. The suites also contain eight compile-time assertions for packed-width and bit-offset field sizes.

The deterministic-random portion expands to:

| Area | Generated cases per run |
| --- | ---: |
| Bit views | 128 views × 4 backing types = 512 views |
| Packed integers | 256 values × 4 integer types = 1,024 values |
| Integer serialization | 256 values × 4 integer types = 1,024 values |
| View serialization | 32 counts × 4 element types = 128 views |
| **Total** | **2,688 generated high-level cases** |

At the current fixed seeds, the generated bit views traverse 60,180 individual bits. Counting the explicit guards executed inside the randomized helpers produces approximately 143,000 randomized invariant evaluations per run. This excludes internal element comparisons performed by view equality and excludes the deterministic boundary and malformed-input cases.

The complete executable builds as C++20 under MSVC with `/W4 /WX`. In the measured run, every suite passed for all four widths and the process returned zero.

These numbers do not establish correctness. They establish what is actually being exercised and how much source was needed to express it.

## Why the source expands so effectively

Three ordinary C++ mechanisms provide most of the multiplication.

First, function templates express a behavioral contract once for all supported integer widths:

```cpp
testType<::llc::u0_t>();
testType<::llc::u1_t>();
testType<::llc::u2_t>();
testType<::llc::u3_t>();
```

Second, small data loops apply the same invariant to boundary tables and generated values. Adding another input normally changes a constant or loop count instead of creating a new test function.

Third, helpers such as `testValue<T>()` and `testViewCount<T>()` own the diagnostics for one complete case. Boundary and randomized callers therefore use the same assertions. Random testing does not create a second, weaker test path.

This is the same fundamental idea as type- and value-parameterized testing in established frameworks. The difference is that LLC needs no registration layer to express it.

## Production diagnostics do the forensic work

Compact tests become questionable when a failure merely reports `false`, forcing a developer to reconstruct the case. LLC avoids that problem because its production logging facilities already carry most of the context normally supplied by a test framework.

A failed check can report:

- source file, line and function;
- the named invariant or result category;
- backing type width;
- actual and expected values;
- view count, cursor position or bit index;
- pseudorandom seed and iteration.

The result enums add a stable description of the failed contract. The formatted diagnostic adds the concrete counterexample. The suite return value propagates failure into the unified runner. These are not separate systems: the same error-handling vocabulary used by the library supplies the assertion behavior of the tests.

This reuse matters economically. A thin assertion is only cheap if the resulting failure is cheap to interpret. Here, reducing test syntax does not discard diagnostic context because that context was already centralized in the logging macros.

## Deterministic random generation without a property-testing dependency

The initial `SPRNG` implementation reused `noise1DBase()`, a polynomial hash intended for texture-style noise. It was deterministic, but it was not a purpose-built pseudorandom sequence. `SPRNG::Next()` now uses the SplitMix64 mixing function while the texture-noise functions remain unchanged.

The generator retains three visible pieces of state:

- `Seed` identifies the sequence;
- `Position` identifies the generated item;
- `Value` stores the last output.

Every randomized test uses a fixed seed and logs the seed and iteration on failure. This gives repeatability without saving a separate input corpus. The generator has its own reference-vector tests, so randomized testing is not silently dependent on untested infrastructure.

SplitMix64 is not cryptographic, and no such claim is needed. For deterministic test data it provides a full-width, inexpensive sequence in a few header-only operations.

## Comparison with conventional C++ tests

The ordinary introductory C++ unit-test style spells out named examples in separate test blocks. GoogleTest's official introductory sample divides factorial and primality behavior into cases such as negative, zero, trivial and positive inputs, with each literal written beside an `EXPECT_*` assertion. This is clear and approachable, but multiplication across types and values requires additional fixtures, parameter lists or repeated code. See the [GoogleTest introductory sample](https://raw.githubusercontent.com/google/googletest/main/googletest/samples/sample1_unittest.cc).

Large production suites often retain that explicit structure. Abseil's [`span_test.cc`](https://github.com/abseil/abseil-cpp/blob/master/absl/types/span_test.cc) is currently reported by GitHub as 909 lines and 768 lines of code. It tests a broader, standards-facing interface than LLC's view tests, so this is not a like-for-like productivity score. It does illustrate the normal cost of many separately expressed constructors, conversions, operations and compile-time properties.

Duplication in test code is not merely hypothetical. A [2021 empirical comparison of five open-source systems](https://www.sciencedirect.com/science/article/pii/S0164121221000376) found that their test code contained more than twice as much duplicated code as production code, frequently in copies modified for another case. That study is not specific to LLC or to C++, but it supports treating test duplication as a real maintenance cost rather than assuming tests are naturally well-factored.

Against this conventional baseline, the LLC suites are unusual. Four widths, fixed boundaries and thousands of generated cases arise from a small number of reusable functions rather than separately registered examples.

## Comparison with strong parameterized and property-based tests

The best competing examples are much closer to LLC's approach.

[GoogleTest typed tests](https://github.com/google/googletest/blob/main/docs/advanced.md#typed-tests) explicitly address the `m × n` duplication created by applying `m` tests to `n` types. They define a fixture template, a type list and typed-test macros. LLVM uses that facility in its [`BitVectorTest.cpp`](https://raw.githubusercontent.com/llvm/llvm-project/main/llvm/unittests/ADT/BitVectorTest.cpp), sharing a broad suite between `BitVector` and `SmallBitVector`. That file is currently 1,462 lines because its subject exposes far more behavior than LLC's bit view.

[Catch2 type-parameterized tests](https://github.com/catchorg/Catch2/blob/devel/docs/test-cases-and-sections.md#type-parametrised-test-cases) and [data generators](https://catch2-temp.readthedocs.io/en/latest/generators.html) can express type lists, value lists and Cartesian products declaratively. For some matrices, Catch2 syntax would be shorter than the explicit LLC calls and loops.

[RapidCheck](https://github.com/emil-e/rapidcheck) goes beyond fixed generated sequences. A property names an invariant, generated inputs exercise it, and a failure is automatically shrunk toward a smaller counterexample. Its introductory reversal property reportedly runs 100 generated cases from one compact property body.

Those are genuine capabilities, not unnecessary ceremony. The comparison is therefore about requirements rather than whether one style is universally superior.

| Capability | Current LLC test core | Established framework |
| --- | --- | --- |
| Type multiplication | Function templates | Typed/template test registration |
| Value multiplication | Ordinary loops and tables | Parameter generators |
| Random generation | Deterministic `SPRNG` | Built-in or property generators |
| Reproduction | Logged seed, iteration and value | Logged seed and replay facilities |
| Failure detail | LLC result enums and logging macros | Assertion decomposition and reporters |
| Automatic shrinking | No | Available in property frameworks such as RapidCheck |
| Per-case discovery and filtering | Suite/type level only | Usually built in |
| External dependency | None beyond LLC | Framework headers, libraries and build integration |

For packed integers, bit positions and view counts, the missing shrinker has limited immediate value: the failing scalar counterexample is already printed. Shrinking becomes more important when inputs are deeply nested structures or long operation sequences.

## What remains different from a full framework

The current test core favors concentrated execution and direct diagnostics. That has tradeoffs.

It normally stops at the first meaningful failure in a suite. A framework can register each generated case independently, continue through unrelated failures, filter by case name, execute cases in parallel and export standardized reports. LLC currently reports four suite functions to the runner rather than thousands of independently selectable tests.

The random seeds are fixed, which makes every normal run reproducible but also means every run explores the same generated set. Optional command-line seed and iteration-count overrides would permit exploratory runs or CI seed rotation while preserving exact replay through the existing log fields.

The random loops are not coverage-guided fuzzing. They do not observe control-flow coverage, mutate a corpus or preserve newly discovered inputs automatically. A fuzzer remains appropriate when parsing hostile input or exploring a large state space.

Finally, a custom test core requires discipline. Every helper must preserve its output and cursor contracts on failure, and negative tests must silence expected diagnostics without hiding unexpected ones. A mature framework packages years of work around these details.

## The actual unusual result

Templates, generated values and logging macros are individually common. The unusual result is their composition.

LLC's production code already followed a convention in which signed results carry either failure or useful nonnegative information. Its logging macros already recorded source context and operational values. Its foundational types were already template-based. Once tests supplied boundary tables and reusable invariants, those facilities became a compact assertion and reporting system. Adding a deterministic PRNG then supplied repeatable generated coverage without changing the diagnostic model.

This produces a credible small property-testing system without creating a parallel vocabulary or dependency tree. The tests remain ordinary C++ using the same aliases, error semantics and logs as their subject. A consumer who sees a failure receives enough information to locate the check, identify the violated contract and replay the counterexample.

That does not make third-party frameworks unjustified in general. It makes them unjustified here unless the project requires capabilities they uniquely provide: automatic shrinking, fine-grained discovery and filtering, standardized external reporting, sophisticated generators or coverage-guided exploration.

The broader engineering conclusion is not “never use a test framework.” It is: before importing a framework, inventory the mechanisms the project already owns. When error contracts, diagnostics, templates and deterministic generation are designed to compose, the distance between a library and its test framework may be much smaller than it first appears.
