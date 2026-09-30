# How two output paths replace a build infrastructure

Multi-repository C++ builds often accumulate machinery around a few simple questions. Where did a library put its binary? Which version belongs to this application? How does another project find it? Where must a DLL be copied before debugging? Which directories should continuous integration preserve or delete?

The usual answers introduce package descriptions, installation prefixes, exported targets, generated configuration files, environment variables, deployment steps and build-system-specific glue. Each mechanism may be reasonable by itself. Together, they can become a second software system whose job is to explain where the first software system put its files.

The bundles around LLC, GPK and their applications use a smaller answer. Every participating project publishes final artifacts to one directory named by platform and configuration. Every project writes intermediate files to a parallel `obj` hierarchy qualified by project name.

In MSBuild terms, the recurring contract is equivalent to:

```xml
<OutDir>$(BundleRoot)/$(Platform).$(Configuration)/</OutDir>
<IntDir>$(BundleRoot)/obj/$(Platform).$(Configuration)/$(ProjectName)/</IntDir>
```

GNU make expresses the same relationship:

```make
OutDir := $(BundleRoot)/$(Platform).$(Configuration)
IntDir := $(BundleRoot)/obj/$(Platform).$(Configuration)/$(ProjectName)
```

There is no custom build tool interpreting this convention. `BundleRoot` is normally obtained by walking a known number of levels upward from the project or solution directory. MSBuild, GNU make and the linker already provide everything else.

The result is not merely a preference for tidy source directories. It is a small build protocol shared by independently versioned repositories.

## The bundle is the boundary

The important boundary is not the developer's entire disk and not an unlimited monorepo. It is a bundle: a deliberately selected set of sibling repositories that are expected to build and run together.

`bundle_galaxy_hell` is a direct example. Its root repository pins four submodules:

```text
bundle_galaxy_hell/
    gpk/
    gpk_data/
    gpk_games/
    zlib/
```

The solution inside `gpk_games` references projects in its siblings: LLC and the engine inside `gpk`, and zlib inside `zlib`. Those projects do not publish into their own repositories. They converge on directories owned by the bundle:

```text
bundle_galaxy_hell/
    x64.Debug/
        galaxy_hell.lib
        galaxy_hell_win32.exe
        gpk_engine.lib
        llc.lib
        zlibvc.lib
        ...debug symbols and runtime files...
    obj/
        x64.Debug/
            galaxy_hell/
            galaxy_hell_win32/
            gpk_engine/
            llc/
            zlibvc/
```

The flat final directory is intentional. It is the bundle's link and runtime stage. The project-qualified intermediate hierarchy prevents ordinary compiler outputs from mixing while keeping every disposable build file outside the source repositories.

Another bundle may contain another revision of LLC and produce another `llc.lib`. There is no conflict because that bundle has a different root. Artifact names need to be unique only within the deliberately composed product, which is already the namespace in which the linker must distinguish them.

## Submodules supply the dependency manifest

A conventional dependency manager needs a manifest describing the component set and a lockfile selecting exact versions. A bundle repository already contains both pieces of information.

Its `.gitmodules` file names the components and records where they come from. Its gitlinks pin the precise commit of each component. Cloning the bundle recursively reconstructs the compatible source topology. The directory names are stable inputs to project-relative include and project-reference paths.

This is dependency management at repository granularity:

| Conventional mechanism | Bundle equivalent |
| --- | --- |
| Dependency manifest | The bundle's submodule list |
| Version lockfile | Pinned submodule commits |
| Source acquisition | Recursive submodule checkout |
| Package installation prefix | `<BundleRoot>/<Platform>.<Configuration>` |
| Library discovery | The shared output directory |
| Runtime deployment stage | The same shared output directory |
| Build cleanup | Remove the selected output and `obj` directories |
| CI artifact discovery | Archive the selected output directory |

The comparison is not exact in every capability. A general package manager can resolve version ranges, share binary caches and serve unrelated consumers. The bundle deliberately does less. It records one known composition and makes that composition inexpensive to build from source.

`llb` demonstrates the same design at a smaller scale. It bundles LLC, LLT and zlib. The LLC solution builds the library and its tests; the LLT solution builds tools such as `ilc` and `dedup`. Both solutions publish into `llb/x64.Debug` or its release and 32-bit counterparts. A tool in LLT links `llc.lib` and `zlibvc.lib` by name from the same directory in which it places its executable.

The solutions can therefore divide a large workspace by purpose without dividing its binary stage.

## A loose bundle for active development

`dev_setup` applies the same topology without pinning everything beneath one parent repository. Its setup script creates an `asm128` directory and clones GPK, its samples and games, LLC, LLT, zlib and the tutorial repositories as siblings.

That form serves a different purpose. A pinned bundle answers, “Which exact revisions constitute this product?” The development setup answers, “Give me the current collection of repositories in the geometry their projects expect.” Updating one repository to its latest branch is easy, and every existing relative path remains valid.

The output convention survives both modes:

```text
asm128/
    gpk/
    gpk_games/
    gpk_samples/
    llc/
    zlib/
    x64.Debug/
    x64.Release/
    obj/
```

This distinction is useful. Reproducible products use pinned bundle repositories. Broad framework work can use a moving sibling checkout. The projects themselves do not need separate configuration systems for those two workflows.

## Scale is the proof

The value of the convention becomes clearer when measured across the development workspace rather than demonstrated with one application.

The current `asm128` checkout contains the 23 repositories named by `dev_setup`. Across those repositories are 25 Visual Studio solution files, 226 C++ project files and 14 Makefiles. Some of the largest individual solutions declare substantial cross-repository build graphs:

| Solution | Declared C++ projects |
| --- | ---: |
| `gpk_samples` | 47 |
| `gpk` | 26 |
| `gpk_games` | 23 |
| `llc` | 22 |
| `ced` | 17 |
| `gpftw_master` | 13 |

These counts are not presented as a measure of code quality or as 226 unrelated products. They measure how much buildable surface shares the convention. Tutorials, tests, libraries, command-line tools, games, Windows front ends and Linux targets can coexist without 226 separately designed integration layouts.

That is why setup and maintenance can remain a matter of minutes even when the visible project count is large. `dev_setup` obtains the repositories in one sibling topology. A developer opens the solution relevant to the current task. The solution supplies the desired dependency graph, while every selected project already agrees where headers, libraries, executables and intermediates belong. Moving from one sample or product to another does not require assembling another package environment or deployment directory.

The convention therefore improves throughput in a way that line-count comparisons miss. It makes another project cheap. Once a repository follows the geometry, adding it to a bundle does not create a new category of build infrastructure to maintain.

## Cross-project linking becomes ordinary

When every compatible library publishes into the same stage, a consumer does not need to reconstruct the producer's internal build tree. Its link settings can say:

```text
Library directory: $(OutDir)
Libraries: galaxy_hell.lib; gpk_engine.lib; llc.lib; zlibvc.lib
```

The solution or project references provide dependency ordering. The output convention provides artifact discovery. These are separate concerns and each has a compact representation.

The same arrangement improves debugging. Executables, debug symbols and any required runtime libraries naturally meet in one directory. Visual Studio projects use `$(OutDir)` as the debugger working directory, so the path used during linking is also the path used during execution. There is no post-build copy merely to reconstruct a runnable directory.

The directory is also inspectable by a person. Looking at `x64.Debug` immediately answers which applications and libraries the bundle produced. Looking at `obj/x64.Debug` identifies which projects participated. No knowledge of each project's default output conventions is required.

## The convention crosses build systems

The design is not tied to Visual Studio. The Makefiles for GPK, LLC and the `smart` applications use the same platform-and-configuration stage.

On Linux, the `smart` library produces `smart.a`. Applications such as `dryer`, `demo_image`, `demo_network`, `demo_serial` and `demo_ui` consume `smart.a`, `llc.a` and `zlibvc.a` from their common `Linux.x64.Release` or `Linux.x64.Debug` directory. Their object files remain separated under `obj/Linux.x64.Release/<ProjectName>`.

`saipp` repeats the pattern for an ARM-oriented build. Its Visual Studio project and GNU Makefile use different compilers but agree on the artifact geometry. A developer does not need to learn a new repository layout merely because the platform changed.

This does not require every external tool to be forced into the convention. `nio_firmware`, for example, allows PlatformIO to retain its normal ignored `.pio` build tree while consuming sibling source libraries. The convention is valuable where the projects control their output layout; it is not a reason to fight a specialized tool that already supplies an adequate isolated build directory.

## The machinery that disappears

The saving is larger than the number of configuration lines removed. The convention eliminates recurring coordination work.

An internal static library does not need an install target before another repository can link it. It does not need a generated package configuration describing its binary directory. Consumers do not need per-library environment variables or a search procedure. Applications do not need individual commands copying each dependency into a runnable folder. CI does not need to search every project tree for outputs. Clean scripts do not need to understand every compiler's file extensions.

More importantly, every new component inherits the same behavior. A library project supplies a unique target name and writes to `OutDir`. A tool links the names it uses and writes its executable to the same place. The amount of infrastructure does not grow proportionally with the number of dependency edges.

This is the same economic principle described in [Every engineering choice spends or saves a budget](./every-choice-has-a-cost.md): a small shared mechanism is especially valuable when it removes repeated work from every producer, consumer, debugger session and automation script.

## Cleanup is part of the architecture

Because generated files have two predictable roots, cleanup can be exact without cataloguing file types. `bundle_galaxy_hell` provides both Windows and shell scripts that remove its configuration directories and `obj`. Its root `.gitignore` names the same directories.

That ownership matters. The bundle creates the shared artifact directories, so the bundle—not an individual submodule—must ignore and remove them. A submodule's `.gitignore` cannot govern generated siblings in its parent repository.

A normal incremental clean may remove only the intermediate directory and retain final artifacts for reuse. A reproducibility clean removes both the chosen platform-configuration stage and its matching `obj` subtree. Both operations are simple because the boundary is explicit.

## What the convention requires

The reduction in machinery is purchased with discipline, not magic.

Repositories must appear at the expected relative depth. Target names must be unique within a bundle. Components that share an output directory must agree on the ABI dimensions represented by its name. If two builds use materially different compilers, runtimes or feature sets, the platform-configuration key must distinguish them or the directory must be cleaned between builds.

Independent processes should not simultaneously build the same project into the same bundle and configuration. Direct project builds also work most reliably when the output root is derived from the project location; projects that derive it from `$(SolutionDir)` expect to be built through a correctly placed solution.

Finally, this arrangement is optimized for source-composed products. A public binary SDK with unknown consumers has different requirements: stable installation layouts, versioned interfaces, discovery metadata and possibly multiple compiler ABIs. Avoiding that machinery inside a controlled bundle does not imply that the machinery has no valid use elsewhere.

These constraints are modest because the bundle already controls the relevant variables. They are the contract that replaces the larger general-purpose system.

## Comparison with common generated build trees

A conventional Visual Studio repository often leaves `Debug`, `Release`, `x64` or intermediate files beneath every project. That maximizes local independence but scatters the product across the source tree. Linking, debugging, cleaning and artifact collection must rediscover all of those locations.

An out-of-source CMake build improves the separation by placing generated files under a build tree. It can model dependency propagation thoroughly and generate target-specific internals. For projects that need configuration discovery, installation, several generators or third-party consumption, that machinery can be worthwhile.

The bundle convention selects a narrower point in the design space. Source repositories remain independent, but their physical arrangement supplies the information a generated super-build would otherwise encode. Final outputs are deliberately gathered rather than target-isolated because the bundle wants a usable product stage, not merely separate successful compilations.

The goal is not the smallest possible number of files. It is the smallest mechanism that preserves the required composition.

## Directory geometry as infrastructure

The complete protocol can be stated in one sentence:

> Sibling repositories in a bundle publish final artifacts to the bundle's platform-and-configuration directory and intermediates to its project-qualified `obj` hierarchy.

From that convention follow source cleanliness, library discovery, multi-solution reuse, debugger staging, cross-platform familiarity, coarse and exact cleanup, and simple CI collection. Git submodules add reproducible composition without changing the build rule. A loose setup script provides the same geometry for active framework development.

This is infrastructure through constraint rather than infrastructure through additional software. Two path formulas do the work because the repositories, solutions, Makefiles and bundle definitions all agree on what those paths mean.

The remarkable result is not that the build is unconventional. It is that so many conventional mechanisms become unnecessary once one small convention is allowed to remain mechanically coherent across the whole system.
