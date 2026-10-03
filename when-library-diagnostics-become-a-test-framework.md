# When library diagnostics become a test framework

A test framework normally supplies several things at once: assertions, test registration, parameterization, failure reporting, filtering, random generation and result aggregation. That bundle is convenient, but it can hide a more useful engineering question: which of those capabilities does a project actually lack?

LLC already had a signed-result convention, logging macros that preserve the failing expression and source location, compact containers and views, compile-time templates, timers and deterministic noise utilities. A concentrated collection of tests showed that these facilities can compose into most of the testing system needed for LLC's foundational types. The result is not an argument that external test frameworks are universally unnecessary. It is a measured example of an existing library making a new dependency unnecessary for a specific job.

This article records the resulting design, its current metrics, comparisons with both conventional and strong third-party tests, and the capabilities that remain outside its scope.

## What is under test

The current `llc_test_core` executable contains nine suites:

- `testSPRNG()` validates the deterministic pseudorandom generator against the SplitMix64 reference sequence, including state tracking, reset and seed differentiation.
- `testCPow()` validates compile-time powers, signed and fractional bases, digit extraction and numeric digit-to-character mapping.
- `testStr()` validates the best-effort string adapter over arrays, views, static and dynamic POD storage, mutable and const inputs, empty strings, booleans and numeric temporary storage.
- `testArrayStatic()` validates compile-time extent, layout, representations, slicing, lookup and failure-state preservation.
- `testArrayPod()` validates construction, ownership, assignment, growth, resizing, appending, insertion, removal, termination, composition, failure contracts and self-aliasing.
- `testView()` validates construction, slicing, representations, mutation, equality, filling, reversal, iteration, enumeration, lookup and extrema, including invalid and empty ranges.
- `testViewBit()` validates mutable and const bit views, iterator positions, logical and storage ends, partial final elements, decrement, equality and proxy writes.
- `testPackedUInt()` validates the packed unsigned-integer representation across width bands, including its multiplier, tail, serialized width, byte view, round trip and input consumption.
- `testViewSerialize()` validates packed integer and view serialization, append behavior, cursor advancement, empty views, ownership, aliasing and truncated inputs.

`array_static<>`, `array_pod<>` and `view<>` run the same behavioral contracts against all eight signed and unsigned integer aliases from 8 to 64 bits. The bit, packed-integer and serialization suites run against the four unsigned widths. Other suites instantiate the arithmetic and string types appropriate to their contracts. The logic is written once as function templates and multiplied across the type families.

The fixed cases are important. Random generation is poor at finding narrow transitions by chance, so the packed-integer tests explicitly exercise each width band's minimum, an interior sample and maximum. View serialization explicitly covers counts `0`, `1`, `2`, `63`, `64`, `255`, `16383` and `16384`. Container and view tests deliberately exercise empty, first, middle, final, one-past-end and malformed ranges. Random inputs supplement those cases; they do not replace them.

## Measured size and executed coverage

The following measurements were taken from the working source on 2026-10-01. “Recorded invariant sites” counts written uses of the logical check and requirement macros. It is a source metric, not the number of times those checks execute.

| Source file | Lines | Nonblank lines | Recorded invariant sites |
| --- | ---: | ---: | ---: |
| `llc_test_core.cpp` | 62 | 52 | 0 |
| `llc_test_noise.cpp` | 43 | 41 | 4 |
| `llc_test_cpow.cpp` | 131 | 118 | 8 |
| `llc_test_str.cpp` | 240 | 222 | 23 |
| `llc_test_array_static.cpp` | 316 | 300 | 39 |
| `llc_test_array_pod.cpp` | 777 | 723 | 94 |
| `llc_test_view.cpp` | 881 | 815 | 95 |
| `llc_test_view_bit.cpp` | 360 | 343 | 33 |
| `llc_test_packed_int.cpp` | 163 | 150 | 12 |
| `llc_test_view_serialize.cpp` | 421 | 401 | 41 |
| **Total** | **3,394** | **3,165** | **349** |

The 76-line shared test header is not included in that table. It defines the generic grouped-result record, its type-erasing recorder, success and failure counting, expected-throw support and the two check forms used by every suite. The suites also contain nine compile-time assertions.

The written sites expand at runtime as follows in the current Debug x64 build:

| Suite | Executed checks |
| --- | ---: |
| `testSPRNG()` | 10 |
| `testCPow()` | 210 |
| `testStr()` | 164 |
| `testArrayStatic()` | 312 |
| `testArrayPod()` | 703 |
| `testView()` | 1,504 |
| `testViewBit()` | 122,396 |
| `testPackedUInt()` | 10,698 |
| `testViewSerialize()` | 13,044 |
| **Total** | **149,041 checks** |

The deterministic-random portion expands to:

| Area | Generated cases per run |
| --- | ---: |
| Bit views | 128 views × 4 backing types = 512 views |
| Packed integers | 256 values × 4 integer types = 1,024 values |
| Integer serialization | 256 values × 4 integer types = 1,024 values |
| View serialization | 32 counts × 4 element types = 128 views |
| **Total** | **2,688 generated high-level cases** |

At the current fixed seeds, the generated bit views traverse 60,180 individual bits. The complete result contains 262 named result groups. Internal element comparisons performed by equality helpers are not counted as separate checks.

The complete executable builds as C++20 under MSVC with `/W4 /WX`. In the measured run, all 149,041 checks passed in 402,002 microseconds and the process returned zero. Each suite reports its own elapsed time and executed check count, so even a quiet successful run exposes how much work actually occurred.

These numbers do not establish correctness. They establish what is actually being exercised and how much source was needed to express it.

## Why the source expands so effectively

Three ordinary C++ mechanisms provide most of the multiplication.

First, function templates express a behavioral contract once for all supported integer widths:

```cpp
testType<::llc::u0_t>(); testType<::llc::s0_t>();
testType<::llc::u1_t>(); testType<::llc::s1_t>();
testType<::llc::u2_t>(); testType<::llc::s2_t>();
testType<::llc::u3_t>(); testType<::llc::s3_t>();
```

Second, small data loops apply the same invariant to boundary tables and generated values. Adding another input normally changes a constant or loop count instead of creating a new test function.

Third, helpers such as `testValue<T>()` and `testViewCount<T>()` own the diagnostics for one complete case. They report the values that vary for that case; the typed caller owns stable type context and reports successful completion once for the group. Boundary and randomized callers therefore use the same assertions without passing presentation-only strings through every helper. Random testing does not create a second, weaker test path.

This is the same fundamental idea as type- and value-parameterized testing in established frameworks. The difference is that LLC needs no registration layer to express it. At the outermost level, a tiny suite wrapper adds timing and derives the printable suite name from the function token, preventing the function and its diagnostic label from drifting apart.

## Production diagnostics do the forensic work

Compact tests become questionable when a failure merely reports `false`, forcing a developer to reconstruct the case. LLC avoids that problem because its production logging facilities already carry most of the context normally supplied by a test framework.

A failed check can report:

- source file, line and function;
- the named invariant or result category;
- backing type width;
- actual and expected values;
- view count, cursor position or bit index;
- pseudorandom seed and iteration.

The result enums add a stable description of the tested contract. They remain private to their suites. Operation identity belongs in those values rather than in a second label argument that can become stale. At the check boundary, a templated recorder converts any enum value into a generic entry containing its numeric value, enum name, value name, description, failure count and success count. The formatted diagnostic adds the concrete counterexample immediately, while the final report groups repeated results by enum type and value.

The formatting boundary also preserves the types used by the tests. Pointer arguments remain typed at the check site; the logging facility's `printf_arg()` adapter performs the representation required by `%p`. This removes casts whose only purpose was formatting while leaving semantic casts visible. The check macros similarly use `__VA_OPT__` for truly optional argument lists, so a check with no additional values does not require a dummy argument or a second macro body.

This separation also preserves LLC's signed-result convention. A suite's `err_t` reports only whether the test machinery itself failed; logical failures populate the shared error array. Ordinary checks record and continue through every safe assertion, generated input, backing width and later suite. A requirement records the failure and abandons only the current case when proceeding could access invalid test data. These are not separate systems: the same error-handling vocabulary used by the library supplies the assertion behavior of the tests.

Successful runs are concise by default: each suite prints elapsed microseconds and its check count, followed by one total. Passing detail remains available at runtime through `--success-details`, which expands the same named result groups without requiring another build. This reuse matters economically. A thin assertion is only cheap if the resulting failure is cheap to interpret. Here, reducing test syntax does not discard diagnostic context because that context was already centralized in the logging macros.

## Deterministic random generation without a property-testing dependency

The initial `SPRNG` implementation reused `noise1DBase()`, a polynomial hash intended for texture-style noise. It was deterministic, but it was not a purpose-built pseudorandom sequence. `SPRNG::Next()` now uses the SplitMix64 mixing function while the texture-noise functions remain unchanged.

The generator retains three visible pieces of state:

- `Seed` identifies the sequence;
- `Position` identifies the generated item;
- `Value` stores the last output.

Every randomized test uses a fixed seed and logs the seed and iteration on failure. This gives repeatability without saving a separate input corpus. The generator has its own reference-vector tests, so randomized testing is not silently dependent on untested infrastructure.

SplitMix64 is not cryptographic, and no such claim is needed. For deterministic test data it provides a full-width, inexpensive sequence in a few header-only operations.

## When tests validate the design rather than merely the output

The `array_pod<>` suite illustrates the most valuable role of these tests. Its purpose was not merely to confirm ordinary pushes and removals. It turned implicit ownership and aliasing expectations into executable contracts.

The suite now verifies that:

- null non-empty append and insert sources fail without mutation;
- `push_back()` and filled `resize()` preserve values sourced from the same allocation across reallocation;
- self-append preserves its complete source range;
- scalar self-insertion snapshots its value before shifting storage;
- chain self-insertion handles a source range overlapping the shifted range;
- assignment from an overlapping subview uses safe movement ordering;
- `erase()` rejects null, one-past-end, unrelated and misaligned pointers;
- invalid indexes and oversized counts return failure while preserving address, count and contents;
- every tested mutation preserves the extra zero-valued terminator.

Those contracts exposed real structural defects in the implementation: source pointers could become stale after growth, overlapping copies used unsafe ordering, string append counts were inconsistent, and pointer erasure accepted addresses that were not valid element positions. The implementation was corrected and the discoveries remained as named regression groups.

The arithmetic is compact: 87 checks are applied to each of eight integer types, and seven character-specific composition checks bring the suite to 703 executions. This is the kind of multiplication that makes a small, readable test body useful as design documentation rather than just as a collection of examples.

## Comparison with conventional C++ tests

The ordinary introductory C++ unit-test style spells out named examples in separate test blocks. GoogleTest's official introductory sample divides factorial and primality behavior into cases such as negative, zero, trivial and positive inputs, with each literal written beside an `EXPECT_*` assertion. This is clear and approachable, but multiplication across types and values requires additional fixtures, parameter lists or repeated code. See the [GoogleTest introductory sample](https://raw.githubusercontent.com/google/googletest/main/googletest/samples/sample1_unittest.cc).

Large production suites often retain that explicit structure. Abseil's [`span_test.cc`](https://github.com/abseil/abseil-cpp/blob/master/absl/types/span_test.cc) is currently reported by GitHub as 909 lines and 768 lines of code. It tests a broader, standards-facing interface than LLC's view tests, so this is not a like-for-like productivity score. It does illustrate the normal cost of many separately expressed constructors, conversions, operations and compile-time properties.

Duplication in test code is not merely hypothetical. A [2021 empirical comparison of five open-source systems](https://www.sciencedirect.com/science/article/pii/S0164121221000376) found that their test code contained more than twice as much duplicated code as production code, frequently in copies modified for another case. That study is not specific to LLC or to C++, but it supports treating test duplication as a real maintenance cost rather than assuming tests are naturally well-factored.

Against this conventional baseline, the LLC suites are unusual. Up to eight integer types, fixed boundaries and thousands of generated cases arise from a small number of reusable functions rather than separately registered examples.

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
| Failure detail | Private result enums, detailed logs, timings and grouped summaries | Assertion decomposition and reporters |
| Automatic shrinking | No | Available in property frameworks such as RapidCheck |
| Per-case discovery and filtering | Not yet implemented | Usually built in |
| External dependency | None beyond LLC | Framework headers, libraries and build integration |

For packed integers, bit positions and view counts, the missing shrinker has limited immediate value: the failing scalar counterexample is already printed. Shrinking becomes more important when inputs are deeply nested structures or long operation sequences.

## What remains different from a full framework

The current test core favors concentrated execution and direct diagnostics. It collects every safe logical failure and groups repeated result categories without hiding their individual logs. A framework can additionally register each generated case independently, filter by case name, execute cases in parallel and export standardized reports. LLC currently reports nine timed suite functions to the runner rather than thousands of independently selectable tests.

The random seeds are fixed, which makes every normal run reproducible but also means every run explores the same generated set. Optional command-line seed and iteration-count overrides would permit exploratory runs or CI seed rotation while preserving exact replay through the existing log fields.

The random loops are not coverage-guided fuzzing. They do not observe control-flow coverage, mutate a corpus or preserve newly discovered inputs automatically. A fuzzer remains appropriate when parsing hostile input or exploring a large state space.

Finally, a custom test core requires discipline. Every helper must preserve its output and cursor contracts on failure, and negative tests must silence expected diagnostics without hiding unexpected ones. A mature framework packages years of work around these details.

## The actual unusual result

Templates, generated values and logging macros are individually common. The unusual result is their composition.

LLC's production code already followed a convention in which signed results carry either failure or useful nonnegative information. Its logging macros already recorded source context and operational values. Its foundational types were already template-based. Its timer and runtime argument facilities already existed. Once tests supplied boundary tables and reusable invariants, those facilities became a compact assertion, timing and reporting system. Adding a deterministic PRNG then supplied repeatable generated coverage without changing the diagnostic model.

This produces a credible small property-testing system without creating a parallel vocabulary or dependency tree. The tests remain ordinary C++ using the same aliases, error semantics and logs as their subject. A consumer who sees a failure receives enough information to locate the check, identify the violated contract and replay the counterexample.

That does not make third-party frameworks unjustified in general. It makes them unjustified here unless the project requires capabilities they uniquely provide: automatic shrinking, fine-grained discovery and filtering, standardized external reporting, sophisticated generators or coverage-guided exploration.

The broader engineering conclusion is not “never use a test framework.” It is: before importing a framework, inventory the mechanisms the project already owns. When error contracts, diagnostics, templates and deterministic generation are designed to compose, the distance between a library and its test framework may be much smaller than it first appears.
