# Manual allocation and ownership audit

## Purpose

This audit measures how often application and framework code directly uses the C and C++ heap primitives `malloc()`, `free()`, `new` and `delete`. The measurement tests a recurring architectural claim: storage ownership is concentrated in a few shared mechanisms rather than repeated throughout application, game and firmware logic.

The result matters because the absence of a primitive from application code removes more than a line of syntax. It removes another location where allocation failure, allocator mismatch, missing cleanup, double release or unclear ownership could be introduced. Centralizing the policy also makes it possible to change storage strategies without changing every consumer.

## Scope and method

The scan covered 759 C and C++ source files:

- 671 files across `asm128/gpk`, `asm128/gpk_games` and `asm128/gpk_samples`.
- 88 files in `FirmwareWorks/nio_firmware`.

Candidate tokens were found after excluding comments and string and character literals, then reviewed in their source context. The classification distinguishes:

- Heap `new`, which obtains storage and constructs an object.
- Placement `new`, which constructs an object in storage that already exists and therefore performs no allocation itself.
- `delete`, which releases an object allocated through `new`.
- `= delete`, which prohibits a C++ operation and performs no deallocation.
- First-party code, generated platform templates and bundled third-party sources.

The figures count textual source sites. They do not represent allocations per execution. Conditional platform branches can contain several alternative implementations even though only one enters a particular build.

## First-party results

| Codebase | `malloc()` | literal `free()` | heap `new` | `delete` | placement `new` |
| --- | ---: | ---: | ---: | ---: | ---: |
| GPK solution | 2 | 5 | 2 | 3 | 20 |
| GPK Games | 0 | 0 | 0 | 0 | 0 |
| GPK Samples | 0 | 0 | 3 | 3 | 0 |
| NIO Firmware application | 2 | 0 | 0 | 0 | 2 |

NIO Firmware has one `safe_llc_free(_buffer)` call. It is listed separately because the application invokes the shared deallocation policy rather than calling `free()` directly.

### GPK solution

The direct operations are concentrated in infrastructure:

- The two heap `new` sites and two corresponding `delete` sites implement module creation and destruction in `llc/gpk_app_impl.h` and `llc/gpk_cgi_runtime.h`.
- Nineteen placement constructions are in `llc/gpk_array_obj.h`; the remaining one is in `llc/gpk_ref.h`. These establish object lifetimes inside storage managed by the array and reference mechanisms.
- The `malloc()` and `free()` operations are centralized in `llc/gpk_memory.h`, with one temporary diagnostic allocation in `llc/gpk_log_level.h`.
- The remaining `free` and `delete` sites are the older safety macros in `llc/gpk_safe.h`.

Three of the `free()` sites in `gpk_memory.h` belong to alternative platform branches. They are source definitions, not three releases performed by the same build.

Seven additional first-party occurrences of `= delete` prohibit copying or assignment in `gpk_array_base.h` and `gpk_auto_handler.h`. They are ownership constraints rather than deallocation operations.

### GPK Games

The owned game code contains no direct `malloc()`, `free()`, heap `new` or `delete`. It also contains no placement `new`.

This is the clearest application-level result in the audit. The games perform substantial state management, rendering and simulation while delegating storage and lifetime policy to the shared mechanisms beneath them. A reader of the game logic is not repeatedly required to determine which exit path owns or releases each object.

### GPK Samples

The only first-party heap `new` and `delete` sites are three matched pairs in the older `KitsuRPG` sample:

- Two pairs in `KitsuRPG/main.cpp`.
- One pair in `KitsuRPG/Game_combat.cpp`.

No first-party sample calls `malloc()` or `free()` directly.

### NIO Firmware

The two `malloc()` calls are confined to `src/sai_firmware_updater.cpp`: one allocates the flash-sector working buffer and the other preserves the first encrypted block while an update is incomplete. The ordinary update buffer is released through `safe_llc_free(_buffer)` in `ESPUpdaterClass::abort()`.

The two placement constructions in `src/sai_driver_iridium.cpp` reconstruct `IridiumSBD` in storage supplied by the caller. They express object lifetime without adding a heap allocation to the driver initialization path.

The audit found no release of `_skipBuffer`, allocated in `sai_firmware_updater.cpp`. The buffer may be intended to survive for the updater's lifetime, but no matching ownership action is visible in the reviewed implementation. It should be checked. Its visibility is itself useful evidence: because direct allocation is rare, an exceptional ownership site stands out immediately.

## Complete-directory counts

These totals include copied Microsoft sources, generated platform projects and bundled libraries. They show why an unclassified keyword count would misrepresent the code's ownership policy.

| Complete directory | `malloc()` | `free()` | heap `new` | `delete` | placement `new` | Other |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| GPK solution | 3 | 6 | 7 | 3 | 20 | 11 `= delete` declarations |
| GPK Games | 0 | 0 | 0 | 1 | 0 | The one `delete` is in Microsoft's bundled XAudio2 header |
| GPK Samples | 0 | 0 | 6 | 3 | 0 | 16 C++/CX `ref new` expressions in a Microsoft UWP template |
| NIO Firmware | 29 | 32 | 68 | 50 | 34 | 11 `= delete` declarations |

The large NIO Firmware totals come primarily from the embedded AsyncWebServer, EspSoftwareSerial and Modbus sources. The contrast is substantial: its first-party application layer contains two allocations and no ordinary heap `new` or `delete`, while the bundled libraries account for nearly all direct heap manipulation in the tree.

## Engineering consequences

The measured pattern removes several opportunities for unwanted states from ordinary application code:

- A cleanup path cannot forget a direct `delete` or `free()` that the application never owns.
- Code cannot accidentally pair `new[]` with `delete`, or `malloc()` with `delete`, where those operations are absent.
- Ownership rules are reviewed in a small number of shared implementations rather than rediscovered at every call site.
- Gameplay, rendering and most firmware logic remain independent of a particular allocator.
- Containers can reuse storage, and callers can supply stack, static, arena, shared or platform-owned memory where the API permits it.
- Changing allocation policy affects the central mechanism rather than every consumer.
- Exceptional manual ownership, such as the updater buffers, becomes easy to locate and inspect.

The strongest formulation of the rule is therefore not “perform zero allocations.” Some operations need dynamic storage. The useful target is **zero scattered ownership policy**: allocation, construction, destruction and release should be expressed once at the layer responsible for them.

This measurement does not prove that the programs are leak-free or that every lifetime is correct. It establishes something narrower and directly observable: manual heap ownership is absent from GPK Games, rare in samples and firmware, and concentrated in the storage and module infrastructure of GPK. That concentration reduces the number of places in which an ownership defect can be created and the number of files that must change when storage policy evolves.
