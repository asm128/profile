# When library diagnostics become a test framework

A test run can say “3,177,407 checks passed” and still tell us very little. A loop can inflate a number. A weak predicate can pass a million times. A failure can identify an input while saying nothing about the contract that input violated.

The interesting property of `llc_test_core` is therefore not its check count. It is the structure behind each count: a stable named contract, a concrete counterexample, an explicit continuation boundary, and—where rejection is part of the API—a proof that the rejected operation did not damage the caller's state.

LLC did not acquire that structure by building a parallel test vocabulary. It composed facilities the library already owned: signed results, source-aware diagnostics, enum metadata, templates, views, containers, timers and deterministic generation. This article follows that composition from scalar and container contracts through ownership, GUI, application-runtime and dynamic-module boundaries.

## The current test surface

The current runner registers 57 suites. Five GUI translation units are composed behind the single `testGUI()` registration, so a suite count is not a file count and a file count is not a contract count.

The surface spans several layers:

- scalar, compile-time and representation contracts: powers, enums, bit fields, packed integers, strings, colors, geometry and type metadata;
- storage and ownership contracts: static, POD, object, bit and range arrays; views; reference-counted pointers; aliasing; serialization and byte cursors;
- parser and format contracts: arguments, paths, labels, key/value data, JSON, JSON expressions, XML, MSBuild XML, Base64, PNG and VOX;
- state-machine contracts: input snapshots, system keys, virtual keyboards, GUI controls, layout, text, input boxes, viewports and dialogs;
- integration contracts: application entry points, single- and multithreaded runtimes, process behavior and dynamically loaded runtime modules.

Templates apply one contract to the type families for which it is valid. Fixed boundary tables cover transitions that random generation is unlikely to land on deliberately. Deterministic generated cases add breadth and report their seed and iteration; the runner preserves per-suite fallback seeds but can override them for a whole run. Historical regressions remain named cases instead of disappearing into a generic loop.

## A current measured snapshot

On 2026-10-13, the canonical Debug x64 workflow built with zero warnings and zero errors, then passed 3,177,407 checks across 2,778 named result groups. The runner registered 57 top-level suites.

The same source tree contained 66 `.h` and `.cpp` files: 63 translation units and three headers. It measured 15,306 physical lines including blanks, 14,207 nonblank lines and 1,358,852 bytes. Those are static source measurements; they are not interchangeable with executed checks.

Neither number establishes correctness. Together they establish the current scale and that the named contracts were actually exercised. The durable asset is still the contract structure behind the headline count.

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

The formatting boundary also preserves the types used by the tests. Pointer arguments remain typed at the check site; the logging facility's `printf_arg()` adapter performs the representation required by `%p`. This removes casts whose only purpose was formatting while leaving semantic casts visible. The test surface now exposes two independent choices: `CHECK` versus `REQUIRE` selects continue versus return, while the `F` suffix selects caller-formatted runtime context versus the description already owned by the result enum. All four forms share one implementation.

This separation also preserves LLC's signed-result convention. A suite's `err_t` reports only whether the test machinery itself failed; logical failures populate the shared error array. Ordinary checks record and continue through every safe assertion, generated input, backing width and later suite. A requirement records the failure and abandons only the current case when proceeding could access invalid test data. These are not separate systems: the same error-handling vocabulary used by the library supplies the assertion behavior of the tests.

Successful runs are concise by default: each suite prints elapsed microseconds and its check count, followed by one total. Passing detail remains available at runtime through `--success-details`, which expands the same named result groups without requiring another build. `--test=<suite>` selects a registered suite and may be repeated; every requested name is validated before any suite runs. This reuse matters economically. A thin assertion is only cheap if the resulting failure is cheap to interpret. Here, reducing test syntax does not discard diagnostic context because that context was already centralized in the logging macros.

## Deterministic random generation without a property-testing dependency

The initial `SPRNG` implementation reused `noise1DBase()`, a polynomial hash intended for texture-style noise. It was deterministic, but it was not a purpose-built pseudorandom sequence. `SPRNG::Next()` now uses the SplitMix64 mixing function while the texture-noise functions remain unchanged.

The generator retains three visible pieces of state:

- `Seed` identifies the sequence;
- `Position` identifies the generated item;
- `Value` stores the last output.

Every randomized test has a fixed fallback seed and logs the active seed and iteration on failure. `--seed=<u64>` supplies one deterministic override to the randomized suites, while the generator's own reference-vector suite deliberately keeps its fixed seed. This gives both repeatable defaults and deliberate exploration without saving a separate input corpus. The generator has its own reference-vector tests, so randomized testing is not silently dependent on untested infrastructure.

SplitMix64 is not cryptographic, and no such claim is needed. For deterministic test data it provides a full-width, inexpensive sequence in a few header-only operations.

## Rejection is a state contract

The strongest recurring rule in the suite is not “bad input returns an error.” It is: rejection must be atomic from the caller's point of view.

`array_pod<>` makes that rule visible. A shared failure helper snapshots the original allocation and expected values, performs a rejected operation, then checks the result, address, count, contents and zero-valued terminator independently. The cases include invalid indexes, null non-empty sources, unrelated and misaligned erase pointers, and unsupported reserve or resize counts. Separate aliasing cases exercise self-append, scalar insertion sourced from the same allocation, overlapping chain insertion and assignment from an overlapping subview.

`view_stream<>` applies the same rule to a byte cursor. A truncated read must fail without changing its output or cursor. A truncated write must fail without changing destination storage or cursor. Scalar and array forms use the same byte-count convention, exact-boundary operations succeed, empty operations return zero without movement, and an invalid public cursor makes `remaining()` saturate at zero instead of underflowing.

The JSON-expression suite checks failed lookup and formatting in the same way. Missing keys, invalid roots, bad array or string indexes, failed solver paths and unresolved format tokens must preserve caller output; a failed solver must also discard partial evaluation state.

This is why the result enum matters. “Truncated read failed” and “truncated read left output unchanged” are different contracts. They may share one input, but they do not share one result identity.

## Ownership and lifetime are observable behavior

The pointer suite does not stop at “the value is reachable.” It checks the reference identity and count through copy and move, proves that moved-from owners are empty, releases one owner while the shared object remains alive, and observes exactly one destruction at final release. Replacement and raw-reference adoption are checked against construction and destruction counters.

The container suites make the same distinction between ownership and observation. Copy construction and assignment must allocate independent storage. Move construction transfers the existing allocation and clears the source. View tests prove range identity, constness and mutation through an alias; they do not pretend that the borrowed pointer/count pair keeps its source alive.

## Regressions keep their names

Generated breadth does not replace remembered failures. The JSON-expression suite carries 179 historical expressions. A macro assigns every case a stable pair of results—resolution and returned value—while formatting has its own result identities. If one historical expression regresses, the report names that case and the failed observation instead of reporting only that an iteration in a loop failed.

The same pattern appears in the container work. Bugs found in reallocation, overlapping movement, string append counts and pointer erasure remain represented as named contracts. The suite is therefore an executable account of what the implementation once got wrong and what it now promises not to repeat.

## The contracts cross real integration boundaries

The application suite exercises direct entry, module wrappers, a single-thread lifecycle and a multithread lifecycle. It checks construction, setup, update, draw, cleanup and destruction counts; propagates setup, update, draw and cleanup failures; contains exceptions at the module boundary; proves update/draw overlap; rejects cleanup while draw is active; and uses timeout observations to make stalls visible. The normal multithread path is repeated 64 times because the contract concerns coordination, not one lucky schedule.

The runtime-module suite crosses the DLL boundary. A missing module must leave no partial state. A successful load must resolve every required entry point. Duplicate loading is rejected. Title negotiation is checked first as a size query and then with an exactly sized buffer. A live application prevents unload without damaging the module state. Deletion clears the caller's application pointer; final unload clears the handle and all resolved function pointers.

GUI testing reaches another boundary without merging its owners. `testGUI()` composes control, input, model, layout and render suites. Render tests decode the semantic event queue, interpret it separately, prove that text payload bytes survive changes to the source control, and use control generations to prevent a newly reused slot from inheriting stale image resources.

These are not isolated unit examples. They are tests of handoffs: owner to view, parser to caller, control model to render event, application to runtime, and executable to dynamic module.

## Exact comparisons, not a repository-size league table

The useful comparisons are capabilities documented by named projects.

[GoogleTest typed tests](https://google.github.io/googletest/advanced.html#typed-tests) address the same `m` tests across `n` types problem that LLC handles with ordinary function templates. GoogleTest surrounds that operation with registered parameter names, filtering, XML output and a sharding protocol. Those are runner facilities. They do not make the repeated contract stronger. LLC selects its 57 timed suite functions by their existing function-token names and keeps generated observations attached to the contract they exercise.

[RapidCheck](https://github.com/emil-e/rapidcheck) generates inputs for a property and automatically shrinks a failure. Its [configuration](https://github.com/emil-e/rapidcheck/blob/master/doc/configuration.md) exposes the seed, successful-case limit, size progression and a reproduction token. Shrinking is valuable when a generator produces compound structures or long operation sequences. LLC's current generated domains are scalar values, counts and bit positions whose exact counterexample is already logged with its seed and iteration. A generic shrinker would add machinery without reducing those failures further.

The comparison should not duck the conclusion. Suite selection and command-line seed control were never evidence of a better testing architecture. LLC added both by reusing what it already owned—which required nothing more than **43 net lines of code across six files**, including input validation and wiring every randomized consumer.

The mature frameworks still carry a mountain of used digital toilet paper around conveniences like these: registration machinery, configuration surfaces, compatibility contracts, reporting formats and runner protocols. Some of that machinery is useful. It does not make the underlying tests better. It makes the runner more furnished, more expensive to sustain and harder to discard.

| External facility | LLC position | Engineering consequence |
| --- | --- | --- |
| Typed and value-parameter registration | Function templates, explicit type families, boundary tables and ordinary loops | The contract is multiplied without a second registration vocabulary |
| Named-suite filtering | Repeatable `--test=<suite>` membership filter | The useful part required 43 net lines together with seed control |
| Per-generated-case registration | Generated observations remain under their named contract | Seed, iteration and concrete value reproduce the counterexample without manufacturing a test object for every loop item |
| Automatic shrinking | Current generated failures are already exact scalar counterexamples | Shrinking becomes relevant only when LLC introduces compound generated inputs that can actually be reduced |
| XML and distributed runner protocols | Outside the contract runner's responsibility | Operational adapters belong to a named consumer, not to the definition of a better test |
| Coverage, fuzzing and fault-injection campaigns | Separate verification work | Add them for a concrete subsystem and threat model, not to imitate another project's harness inventory |

The comparison does not show that LLC recreated every mature testing facility in fewer lines. It shows something narrower and sharper: for LLC's present contracts, existing library mechanisms already provide typed multiplication, deterministic generated cases, stable diagnostics, aggregation, lifecycle integration, suite selection and seed control without another dependency. The two alleged command-line advantages were conveniences, not a moat.

## The actual unusual result

Templates, generated values and logging macros are individually common. The unusual result is their composition.

LLC's production code already followed a convention in which signed results carry either failure or useful nonnegative information. Its logging macros already recorded source context and operational values. Its foundational types were already template-based. Its timer and runtime argument facilities already existed. Once tests supplied boundary tables and reusable invariants, those facilities became a compact assertion, timing and reporting system. Adding a deterministic PRNG then supplied repeatable generated coverage without changing the diagnostic model.

This produces a compact contract-testing system with property-shaped generated cases, without creating a parallel vocabulary or dependency tree. The tests remain ordinary C++ using the same aliases, error semantics and logs as their subject. A failure names the violated contract and prints the values needed to reproduce its counterexample.

A third-party facility earns a place only when a named LLC contract or consumer requires something the existing machinery cannot provide. A competitor's feature list is not a requirements document.

The broader conclusion is not “never use a test framework.” It is: count named contracts before counting assertions, and inventory the mechanisms the project already owns before adding a second vocabulary. In `llc_test_core`, millions of executions matter because they remain attached to failure preservation, lifetime and integration contracts that can still be named after the loop is gone.
