# Programming conventions and their reasoning

## Contents

- [Introduction](#introduction)
- [1. Distinguish members from parameters and local variables through casing](#1-distinguish-members-from-parameters-and-local-variables-through-casing)
- [2. Encode a name's role when that helps interpretation](#2-encode-a-names-role-when-that-helps-interpretation)
- [3. Give related operations a consistent naming vocabulary](#3-give-related-operations-a-consistent-naming-vocabulary)
- [4. Qualify library symbols explicitly](#4-qualify-library-symbols-explicitly)
- [5. Align related code into columns](#5-align-related-code-into-columns)
- [6. Keep parallel operations visually parallel](#6-keep-parallel-operations-visually-parallel)
- [7. Keep trivial operations compact](#7-keep-trivial-operations-compact)
- [8. Prefer the shorter branch first when practical](#8-prefer-the-shorter-branch-first-when-practical)
- [9. Resolve irrelevant or finished cases early](#9-resolve-irrelevant-or-finished-cases-early)
- [10. Check failures next to the operation that can fail](#10-check-failures-next-to-the-operation-that-can-fail)
- [11. Use a recognizable vocabulary for recurring failure policies](#11-use-a-recognizable-vocabulary-for-recurring-failure-policies)
- [12. Let signed results carry failure or useful success information](#12-let-signed-results-carry-failure-or-useful-success-information)
- [13. Include operational context in diagnostics](#13-include-operational-context-in-diagnostics)
- [14. Use explicit inner scopes for temporary work](#14-use-explicit-inner-scopes-for-temporary-work)
- [15. Name meaningful intermediate results](#15-name-meaningful-intermediate-results)
- [16. Use local references to shorten access to nested state](#16-use-local-references-to-shorten-access-to-nested-state)
- [17. Make initial state visible at the declaration](#17-make-initial-state-visible-at-the-declaration)
- [18. Express read-only intent through types](#18-express-read-only-intent-through-types)
- [19. Separate sequence access from storage ownership](#19-separate-sequence-access-from-storage-ownership)
- [20. Make representation choices explicit](#20-make-representation-choices-explicit)
- [21. Compose application state and pass it explicitly](#21-compose-application-state-and-pass-it-explicitly)
- [22. Keep implementation helpers local](#22-keep-implementation-helpers-local)
- [23. Build convenient entry points on shared implementation](#23-build-convenient-entry-points-on-shared-implementation)
- [24. Put zero first to identify the kind of check immediately](#24-put-zero-first-to-identify-the-kind-of-check-immediately)
- [25. Comment on reasons and constraints that code cannot express](#25-comment-on-reasons-and-constraints-that-code-cannot-express)
- [26. Limit exception-handling scopes to the operation they protect](#26-limit-exception-handling-scopes-to-the-operation-they-protect)
- [Scope and evolution](#scope-and-evolution)
- [Case study: separating single-path normalization from batch processing](#case-study-separating-single-path-normalization-from-batch-processing)
- [Case study: diagnostic context from a failing check](#case-study-diagnostic-context-from-a-failing-check)

## Introduction

The recurring aim of these conventions is to reduce how much code a reader must inspect and how much unresolved context they must retain. Consistent names and visual shapes support recognition; early exits and limited scopes let the reader finish one concern before moving to the next. Compact checks preserve diagnostic detail through shared logging machinery.

The conventions are most useful in combination. The comparisons below illustrate individual choices, while the case studies show how those choices interact in working code and runtime output. Structural improvements are distinguished from behavioral changes; no measured improvement in comprehension speed is claimed.

This is a working description of the conventions observed in a sample of my C++ projects, refined through discussion. It describes preferences rather than universal requirements. Except for the original code reproduced in rule 26 and the supplied implementations and log excerpt in the case studies, the examples are illustrative and simplified; they are not verbatim extracts or standalone compilable programs. Each rule contrasts an alternative with the preferred approach. These are comparisons of styles and tradeoffs, not statistical claims about what most programmers do. Some alternatives are equally appropriate under different requirements.

The initial sample covered GOD, GFramework, NWOL, SLToolkit, GPK, LLC, the dryer application, MLC, and HDTree. GunZ and bundled third-party libraries were excluded as evidence of personal style. Unless explicitly confirmed below, the reasoning is an interpretation of the observed code.

## 1. Distinguish members from parameters and local variables through casing

Use UpperCamelCase for descriptive data members and lowerCamelCase for parameters and local variables. This distinguishes stored state from working values and permits the same meaningful word without a name clash or shadowing. Short mathematical or color components can retain conventional names such as `x`, `r`, and `g`.

**Contrasting approach:**

```cpp
struct SBuffer {
    uint32_t count = 0;

    void Resize(uint32_t count) {
        this->count = count;
    }
};
```

**Preferred approach:**

```cpp
struct SBuffer {
    uint32_t Count = 0;

    void Resize(uint32_t count) {
        Count = count;
    }
};
```

## 2. Encode a name's role when that helps interpretation

Use recognizable role markers such as `S` for structures, `i` for indices, and `id` for identifiers. These help the reader interpret a value without finding its declaration.

**Contrasting approach:**

```cpp
struct Control {};

for(uint32_t i = 0; i < controls.size(); ++i) {
    const int32_t value = controls[i].Id;
    updateControl(value);
}
```

**Preferred approach:**

```cpp
struct SControl {};

for(uint32_t iControl = 0; iControl < controls.size(); ++iControl) {
    const int32_t idControl = controls[iControl].Id;
    updateControl(idControl);
}
```

## 3. Give related operations a consistent naming vocabulary

Make both the operation and its target predictable. Once a reader knows one name, related functionality becomes easier to find and recognize.

**Contrasting approach:**

```cpp
initializeHome(app);
refreshHomeScreen(app);
onHomeControl(app, idControl);
```

**Preferred approach:**

```cpp
setupScreenHome(app);
updateScreenHome(app);
handleControlHome(app, idControl);
```

## 4. Qualify library symbols explicitly

Spell out the namespace, frequently including the leading `::`. This makes a symbol's origin visible and reduces ambiguity among libraries with similar names.

**Contrasting approach:**

```cpp
using namespace gpk;
using namespace dry;

SGUI & gui = *app.Framework.GUI;
updateScreenHome(app);
```

**Preferred approach:**

```cpp
::gpk::SGUI & gui = *app.Framework.GUI;
::dry::updateScreenHome(app);
```

## 5. Align related code into columns

Align types, names, initializers, or arguments within a related group. The reader can scan vertically and notice differences without reading every line in full.

**Contrasting approach:**

```cpp
const int32_t width = 640;
const int32_t height = 480;
const int32_t pixelCount = width * height;
```

**Preferred approach:**

```cpp
const int32_t width      = 640;
const int32_t height     = 480;
const int32_t pixelCount = width * height;
```

## 6. Keep parallel operations visually parallel

Give similar operations the same layout and expression structure. Repeated shapes make the changing parts stand out and make omissions or mismatches easier to notice.

**Contrasting approach:**

```cpp
destination.Position = source.Position;
destination.Orientation =
    source.Orientation;
destination.Scale = source.Scale;
```

**Preferred approach:**

```cpp
destination.Position    = source.Position;
destination.Orientation = source.Orientation;
destination.Scale       = source.Scale;
```

## 7. Keep trivial operations compact

Keep simple accessors, forwarding functions, and short cases on one line when useful. Mechanically obvious code takes less vertical space, leaving related operations visible together.

**Contrasting approach:**

```cpp
uint32_t size() const {
    return Count;
}

T * begin() {
    return Data;
}

T * end() {
    return Data + Count;
}
```

**Preferred approach:**

```cpp
uint32_t   size () const { return Count; }
const T *  begin() const { return Data; }
const T *  end  () const { return Data + Count; }
T *        begin()       { return Data; }
T *        end  ()       { return Data + Count; }
```

Expand the body when it contains substantive logic that benefits from separate steps. Group similar short functions together and align their names, parameters, and bodies so their differences are visible at a glance. A trivial wrapper can sit immediately above the implementation it delegates to, letting the reader finish the wrapper before entering the longer operation.

## 8. Prefer the shorter branch first when practical

Let the reader finish the simpler alternative before entering the longer one. This reduces how long an unresolved branch must remain in mind. It is a preference, not a requirement to reorder every conditional.

**Contrasting approach:**

```cpp
if(!settings.DisableHTTP) {
    configureServer(server, settings);
    registerEndpoints(server);
    server.begin();
}
else
    server.end();
```

**Preferred approach:**

```cpp
if(settings.DisableHTTP) {
    server.end();
    return 0;
}
configureServer(server, settings);
registerEndpoints(server);
server.begin();
```

## 9. Resolve irrelevant or finished cases early

Use early `return`, `continue`, or `break` to eliminate cases before the main work. This reduces nesting and the number of conditions the reader must keep tracking.

**Contrasting approach:**

```cpp
if(oldScreen != newScreen) {
    for(uint32_t iControl = 0; iControl < controls.size(); ++iControl) {
        if(controls[iControl].Id == idControl) {
            return activateControl(controls[iControl]);
        }
    }
}
return 0;
```

**Preferred approach:**

```cpp
if(oldScreen == newScreen)
    return 0;

for(uint32_t iControl = 0; iControl < controls.size(); ++iControl) {
    if(controls[iControl].Id != idControl)
        continue;

    return activateControl(controls[iControl]);
}
return 0;
```

## 10. Check failures next to the operation that can fail

Keep an operation and its failure policy together. Subsequent code can then be read without carrying an unchecked result in mind.

**Contrasting approach:**

```cpp
int32_t result = loadConfig(config);
// Unrelated work separates the operation from its check.
updateProgressDisplay();
if(result < 0) {
    DBG_LOG("Failed to load configuration.");
    return -1;
}  
result = setupDevice(device, config);
if(result < 0) {
    DBG_LOG("Failed to setup device.");
    return -1;
} 
return 0;
```

**Preferred approach:**

```cpp
if_fail_fw(loadConfig(config));
if_fail_fw(setupDevice(device, config)); // use of config is grouped with related functions
return 0;
```

Here `if_fail_fw` checks for failure, logs a warning, and returns failure from the enclosing function. In the contrasting example, the progress update runs even if loading failed. Moving the check also changes whether that work executes on failure.

## 11. Use a recognizable vocabulary for recurring failure policies

Use the preferred names `if_fail_fw` and `if_fail_te` to compress repeated checks while retaining the recognizable `if_fail` cue. This makes the code easier to approach and scan—more “rebaño-safe”—without repeating the logging and control-flow machinery at every call.

**Contrasting approach:**

```cpp
// Return-on-failure policy written out at each call:
if(buffer.resize(newCount) < 0) {
    warning_printf("Failed to resize buffer.");
    return -1;
}

// Throwing policy, in a separate context:
if(buffer.resize(newCount) < 0) {
    error_printf("Failed to resize buffer.");
    throw ::std::runtime_error("Failed to resize buffer.");
}
```

**Preferred approach:**

```cpp
// In a function that reports failure through its return value:
if_fail_fw(buffer.resize(newCount));

// In a context that uses throwing failure handling:
if_fail_te(buffer.resize(newCount));
```

These policies are distinct: `fw` logs a warning and returns failure; `te` logs an error and throws. Select the policy appropriate to the surrounding API.

## 12. Let signed results carry failure or useful success information

Use negative results for failure and nonnegative results for an index, count, or status where the API calls for it. This combines a simple failure test with a useful successful result.

**Contrasting approach:**

```cpp
bool findControl(int32_t idControl, uint32_t & index) {
    for(uint32_t iControl = 0; iControl < controls.size(); ++iControl)
        if(controls[iControl].Id == idControl) {
            index = iControl;
            return true;
        }

    return false;
}
```

**Preferred approach:**

```cpp
int32_t findControl(int32_t idControl) {
    for(uint32_t iControl = 0; iControl < controls.size(); ++iControl)
        if(controls[iControl].Id == idControl)
            return int32_t(iControl);

    return -1;
}
```

The meaning of a successful result belongs to the individual API; zero does not have to mean the same thing everywhere.

## 13. Include operational context in diagnostics

Report the values that explain what happened, such as indices, sizes, addresses, or state transitions. This reduces the need to reproduce a problem under a debugger.

**Contrasting approach:**

```cpp
error_printf("Invalid index.");
info_printf("Switching screen.");
```

**Preferred approach:**

```cpp
error_printf("Index %u is outside element count %u.", index, count);
info_printf("Switching screen from %i to %i.", oldScreen, newScreen);
```

## 14. Use explicit inner scopes for temporary work

Limit temporary variables to the operation that needs them. For objects with destructors, scope also communicates precisely when a resource is released.

**Contrasting approach:**

```cpp
::std::lock_guard lockEvents(events.Lock);
events.Queue.clear();

updateDisplay(); // The queue lock is still held here.
```

**Preferred approach:**

```cpp
{
    ::std::lock_guard lockEvents(events.Lock);
    events.Queue.clear();
}

updateDisplay(); // The queue lock has already been released.
```

## 15. Name meaningful intermediate results

Give conceptual steps names instead of forcing the reader to repeatedly decode a compound expression. Each name records part of the reasoning.

**Contrasting approach:**

```cpp
const int32_t days = ((seconds / 60) / 60) / 24;
```

**Preferred approach:**

```cpp
const int32_t minutes = seconds / 60;
const int32_t hours   = minutes / 60;
const int32_t days    = hours / 24;
```

## 16. Use local references to shorten access to nested state

Bind a useful local name to the part of an object being worked on. This keeps subsequent expressions short while making it clear that they operate on the original state.

**Contrasting approach:**

```cpp
app.Dryer.State.Temperature = temperature;
updateTemperatureDisplay(*app.Framework.GUI, app.Dryer.State);
```

**Preferred approach:**

```cpp
::gpk::SGUI        & gui        = *app.Framework.GUI;
::dry::SDryerState & dryerState = app.Dryer.State;

dryerState.Temperature = temperature;
updateTemperatureDisplay(gui, dryerState);
```

## 17. Make initial state visible at the declaration

Use value initialization, zero, or a meaningful default close to the declaration. This reduces uncertainty about newly created state and keeps defaults with the data they describe.

**Contrasting approach:**

```cpp
struct SDryerProgram {
    uint32_t Temperature;
    uint32_t Subcycles;
    uint32_t Pressure;

    SDryerProgram() {
        Temperature = 45;
        Subcycles   = 1;
        Pressure    = 0;
    }
};

char text[128];
::std::fill_n(text, 128, '\0');
```

**Preferred approach:**

```cpp
struct SDryerProgram {
    uint32_t Temperature = 45;
    uint32_t Subcycles   = 1;
    uint32_t Pressure    = 0;
};

char text[128] = {};
```

## 18. Express read-only intent through types

Use `const` inputs, references, and intermediate values when mutation is unnecessary. This narrows the effects a reader must consider and lets the compiler enforce the constraint.

**Contrasting approach:**

```cpp
int32_t setupDevice(SDevice & device, SSettings & settings) {
    uint32_t port = settings.Port;
    return device.Open(port);
}
```

**Preferred approach:**

```cpp
int32_t setupDevice(SDevice & device, const SSettings & settings) {
    const uint32_t port = settings.Port;
    return device.Open(port);
}
```

## 19. Separate sequence access from storage ownership

Use a pointer-and-count view when an operation only needs access to existing elements. A slice can describe part of a buffer without allocating or copying it.

**Contrasting approach:**

```cpp
// Make an owning copy of the selected elements.
::std::vector<uint8_t> payload(
    storage + headerSize,
    storage + headerSize + payloadSize
);
```

**Preferred approach:**

```cpp
::llc::view<uint8_t> packet = {storage, storageSize};
::llc::view<uint8_t> payload;
if_fail_fw(packet.slice(payload, headerSize, payloadSize));
```

The view refers to existing storage; that storage must remain alive while the view is used. The contrasting owning copy has independent storage and lifetime. Prefer the view when shared access is intended; copying is appropriate when independence is required.

## 20. Make representation choices explicit

Use fixed-width integers, explicit enum storage, bit fields, or packing where representation matters. These expose storage and layout decisions to someone reading the declaration.

**Contrasting approach:**

```cpp
enum COMMAND { NOP, PUMP, TEMPERATURE };

struct SCommand {
    COMMAND Command = NOP;
    int     Args    = 0;
};
```

**Preferred approach:**

```cpp
enum class COMMAND : uint8_t { NOP, PUMP, TEMPERATURE };

#pragma pack(push, 1)
struct SCommand {
    COMMAND Command = COMMAND::NOP;
    int8_t  Args    = 0;
};
#pragma pack(pop)
```

This illustrates an explicit layout choice; packing alone does not define a complete portable serialization format.

## 21. Compose application state and pass it explicitly

Group related state in structures and pass that state to operations. The call boundary exposes dependencies, and the containing structure shows how the pieces relate.

**Contrasting approach:**

```cpp
SDevice g_device;
SUserUI g_ui;

int32_t updateApp() {
    int error = updateDevice(device))
    if(error)
    {
        printf("updateDevice failed!");
    }
    return updateUI(ui, device);
}
```

**Preferred approach:**

```cpp
struct SApplication {
    SDevice Device;
    SUserUI UI;
};

int32_t appUpdate(SApplication & app) {
    if_fail_fw(updateDevice(app.Device));
    return updateUI(app.UI, app.Device);
}
```

## 22. Keep implementation helpers local

Use file-local helpers for work that is not part of the public API. This limits the surface other code can depend on and keeps implementation changes local.

**Contrasting approach:**

```cpp
// Helpers have external linkage even though only this file needs them.
int32_t labelUpdateTemperature(SApplication & app) {
    return setLabel(app.UI.Temperature, app.Device.Temperature);
}

int32_t labelUpdateTime(SApplication & app) {
    return setLabel(app.UI.Time, app.Device.Time);
}

int32_t labelUpdatePressure(SApplication & app) {
    return setLabel(app.UI.Pressure, app.Device.Pressure);
}
```

**Preferred approach:**

```cpp
static int32_t labelUpdateTemperature(SApplication & app) { return setLabel(app.UI.Temperature, app.Device.Temperature); }
static int32_t labelUpdateTime       (SApplication & app) { return setLabel(app.UI.Time,        app.Device.Time);        }
static int32_t labelUpdatePressure   (SApplication & app) { return setLabel(app.UI.Pressure,    app.Device.Pressure);    }
```

These helpers also illustrate several conventions working together: the shared `labelUpdate` prefix identifies the family, adjacent placement keeps related operations visible, and aligned one-line bodies let the reader focus on the changing fields without reading each function from scratch.

## 23. Build convenient entry points on shared implementation

Let overloads adapt different inputs and delegate to the same underlying operation. This keeps convenience from duplicating behavioral rules.

**Contrasting approach:**

```cpp
int32_t loadConfig(const SJson & json, SSettings & settings) {
    RESULT retval;
    retval = readPort(json, settings.Port);
    if(retval == -1) {
        LOG_ERR("Failed to read value");
        return ERROR; 
    }
    retval = readTimeout(json, settings.Timeout);
    if(retval == -1) {
        LOG_ERR("Failed to read value");
        return ERROR; 
    }
    return 0;
}

int32_t loadConfig(SStringView text, SSettings & settings) {
    SJson json = {};
    int retval;
    retval = parseJson(text, json);
    if(retval < 0) {
        LOG_ERR("Failed to load json");
        return CONFIG_ERROR; 
    }
    retval = readPort(json, settings.Port);
    if(retval == ERROR) {
        LOG_ERR("Failed to read value");
        return CONFIG_ERROR; 
    }
    retval = readTimeout(json, settings.Timeout);
    if(retval == ERROR) {
        LOG_ERR("Failed to read value");
    }
    return OK;
}
```

**Preferred approach:**

```cpp
int32_t loadConfig(const SJson & json, SSettings & settings) {
    if_fail_fw(readPort(json, settings.Port));
    if_fail_fw(readTimeout(json, settings.Timeout));
    return 0;
}

static inline int32_t loadConfig(SStringView text, SSettings & settings) {
    SJson json = {};
    if_fail_fw(parseJson(text, json));
    return loadConfig(json, settings);
}
```

## 24. Put zero first to identify the kind of check immediately

**Confirmed reasoning:** write `0 == Data` and `0 != elementCount` so the opening characters immediately identify a null or zero check. The reader recognizes what the code is trying to do before inspecting the entire operand. Consistent visual shape facilitates reading—or lets the reader avoid reading every character at all.

**Contrasting approach:**

```cpp
if(Data == 0)
    return -1;

if(elementCount != 0)
    processElements(Data, elementCount);
```

**Preferred approach:**

```cpp
if(0 == Data)
    return -1;

if(0 != elementCount)
    processElements(Data, elementCount);
```

Assignment prevention is an additional benefit: accidentally writing `0 = elementCount` is invalid. The primary explanation is early recognition of intent, reinforced by a consistent visual pattern.

## 25. Comment on reasons and constraints that code cannot express

Preserve the information needed to understand why an implementation exists. Compatibility requirements and operational assumptions can otherwise be lost during an apparently harmless edit.

**Contrasting approach:**

```cpp
bool operator==(const SValue & other) const {
    if(this->size() != other.size())
        return false;
    if(this->begin() == other.begin())
        return true;
    return ::llc::equal(other.begin(), this->begin(), this->size());
}

// Return whether the values are different.
bool operator!=(const SValue & other) const {
    return !operator==(other);
}

uint64_t TimeLastSerial = 0;
```

**Preferred approach:**

```cpp
bool operator!=(const SValue & other) const { return !operator==(other); } // Needed for the Android build without C++20 support.
bool operator==(const SValue & other) const {
    if(this->size() != other.size())
        return false;
    if(this->begin() == other.begin())
        return true;
    return ::llc::equal(other.begin(), this->begin(), this->size());
}

uint64_t TimeLastSerial = 0; // Used by the watchdog if a serial I/O call blocks indefinitely.
```

The placement is part of the explanation: the short compatibility comment stays beside the one-line wrapper, and the wrapper sits immediately above the equality operation it delegates to. The equality operation then resolves its simple cases before the general comparison. Compactness, comment placement, function ordering, and early returns work together to make the code easier to read in its real context.

## 26. Limit exception-handling scopes to the operation they protect

Keep subsequent work outside a `try` block when it does not belong to the operation handled by its `catch`. This makes the recovery boundary visible and avoids making the reader interpret unrelated work under that boundary.

**Before — original code:**

```cpp
    try {
        const auto      path         = std::filesystem::absolute(text).lexically_normal();
        const auto      rootLength   = path.root_path().generic_string().size();

        text = path.generic_string();
        while(text.size() > rootLength && text.back() == '/')
            text.pop_back();

        llc::err_t      index;
        if_fail_fe(index = outputPaths.push_back({}));
        llc::string     & normalized    = outputPaths[index];
        if_fail_fe(llc::append_strings(normalized, llc::vcst_t{text.c_str(), (u2_t)text.size()}));
    }
    catch(const std::filesystem::filesystem_error &) { //
        error_printf("Failed to get absolute path for \"%s\". Not a valid path?", input.begin());
        return 1;
    }
    return 0;
```

**Preferred approach:**

```cpp
try {
    std::filesystem::path absolutePath = std::filesystem::absolute(text).lexically_normal();
    u2_c                  rootLength   = (u2_t)absolutePath.root_path().generic_string().size();
    text = absolutePath.generic_string();
    while(text.size() > rootLength && text.back() == '/')
        text.pop_back();
}
catch(const std::filesystem::filesystem_error &) {
    error_printf("Failed to get absolute path for \"%.*s\".", (int)inputPath.size(), inputPath.begin());
    return 1;
}

llc::err_t index;
if_fail_fe(index = outputPaths.push_back({}));
llc::string & normalized = outputPaths[index];
if_fail_fe(llc::append_strings(normalized, llc::vcst_t{text.c_str(), (u2_t)text.size()}));
return 0;
```

The path operation finishes before output insertion begins. Its temporary variables also leave scope at that boundary. The output operations lose an unnecessary indentation level, while the maximum nesting depth and number of decision paths need not change. This is a reduction in the extent of nesting and the amount of code covered by the exception handler, rather than necessarily a reduction in cyclomatic complexity.

The revision also changes naming, explicit types, and the diagnostic. Those are separate from the scope improvement: moving the output operations alone establishes the narrower exception boundary. In particular, the explicit cast of the root length adds a range assumption, and the length-qualified diagnostic accommodates an input view without requiring a terminating null character.

This example preserves the author's `if_fail_fe` policy: log an error and return failure. As with `if_fail_fw` and `if_fail_te`, the readable `if_fail` prefix identifies the check while the suffix selects the policy.

## Scope and evolution

The archive contains multiple generations of code. Older samples sometimes use lowercase members, `using namespace`, or type-oriented variable prefixes; some framework generations use extensive abbreviations. Those are historical variations, not additional requirements for this working guide.

The current error-handling examples deliberately use the preferred `if_fail_fw` and `if_fail_te` vocabulary. Further observations can be added and inferred motivations refined as more code is reviewed.

## Case study: separating single-path normalization from batch processing

This real-world revision brings several of the conventions together. The original implementation embeds the complete single-path operation inside a collection callback. The revised implementation gives that operation a named function and leaves the batch function responsible for applying it to the inputs. The examples below preserve the supplied implementations, including the behavioral details discussed afterward.

### Original implementation

```cpp
#include <filesystem>
#include <string>

llc::err_t pathsAbsolute(
    llc::aobj<llc::string> & output,
    llc::view<const llc::vcst_t> inputs
) {
    llc::err_t result = 0;
    inputs.for_each([&](const llc::vcst_t & input) {
        if(result < 0)
            return;

        std::string text(input.begin(), input.size());
        for(char & character : text)
            if(character == '\\')
                character = '/';

        if(text.empty()) {
            result = -1;
            return;
        }

        try {
            const auto path = std::filesystem::absolute(text)
                .lexically_normal();

            text = path.generic_string();
            const auto rootLength = path.root_path().generic_string().size();
            while(text.size() > rootLength && text.back() == '/')
                text.pop_back();

            llc::string normalized;
            result = llc::append_strings(
                normalized, llc::vcst_t{text.c_str(), (u2_t)text.size()});
            if(result < 0)
                return;

            result = output.push_back(normalized);
        }
        catch(const std::filesystem::filesystem_error &) {
            result = -1;
        }
    });
    return result < 0 ? result : 0;
}
```

### Revised implementation

```cpp
llc::err_t pathAbsolute(
    llc::aobj<llc::string>  & outputPaths,
    llc::vcst_c             & inputPath
) {
    if(0 == inputPath.size())
        return 1;

    std::string text(inputPath.begin(), inputPath.size());
    for(char & character : text)
        if(character == '\\')
            character = '/';

    try {
        std::filesystem::path   absolutePath    = std::filesystem::absolute(text).lexically_normal();
        u2_c                    rootLength      = (u2_t)absolutePath.root_path().generic_string().size();
        text            = absolutePath.generic_string();
        while(text.size() > rootLength && text.back() == '/')
            text.pop_back();
    }
    catch(const std::filesystem::filesystem_error &) {
        error_printf("Failed to get absolute path for \"%.*s\".", (int)inputPath.size(), inputPath.begin());
        return 1;
    }

    llc::err_t      index;
    if_fail_fe(index = outputPaths.push_back({}));
    llc::string     & normalized    = outputPaths[index];
    if_fail_fe(llc::append_strings(normalized, llc::vcst_t{text.c_str(), (u2_t)text.size()}));
    return 0;
}

llc::err_t pathsAbsolute(
    llc::aobj<llc::string> & outputPaths,
    llc::view<const llc::vcst_t> inputs
) {
    if_fail_fe(inputs.for_each([&outputPaths, inputs](const llc::vcst_t & input) { return pathAbsolute(outputPaths, input); }));
    return 0;
}
```

### Structural improvements

The principal improvement is the separation of responsibilities: `pathAbsolute` handles one input, while `pathsAbsolute` applies that operation to a collection. The reader no longer needs to reconstruct the single-path operation from inside the batch callback. The named operation can also be called and tested independently.

The original implementation communicates failure through a captured, mutable `result`. Understanding its behavior requires tracking assignments in several locations and recognizing that the guard at the start of each callback suppresses subsequent work after failure. The revised single-path function expresses its outcome through its own return value. This makes control flow local; whether the batch operation propagates that outcome depends on the iteration contract discussed below.

Several conventions reinforce this separation:

- **Early validation:** the empty-input check occurs before constructing and transforming the temporary string.
- **Explicit dependencies:** the callback names its captures instead of using `[&]`. Only `outputPaths` is needed; the unused `inputs` capture can be removed, leaving `[&outputPaths]`.
- **A narrow exception boundary:** the `try` block covers path normalization, and output insertion follows outside that block. Temporary path values leave scope before insertion begins.
- **Recognizable names and layout:** `pathAbsolute` and `pathsAbsolute` distinguish individual and collection operations; `absolutePath`, `inputPath`, and `outputPaths` expose their roles. Alignment supports scanning related declarations.
- **Contextual diagnostics:** the filesystem failure message identifies the input. The precision-qualified string format accommodates a view without requiring a terminating null character, provided its length fits the format's integer precision argument.

These are structural observations, not measured comprehension results. The revision removes the enclosing callback level from the single-path logic, removes shared result bookkeeping, and moves output work outside the exception handler. Those changes support reading the operation in distinct stages without claiming a measured reduction in reading time or necessarily in cyclomatic complexity.

### Behavioral details to verify

The decomposition should be assessed separately from behavioral equivalence. The two implementations differ in ways that require an explicit API contract.

**Callback failure propagation.** The LLC `view::for_each` implementation inspected during the initial review discarded callback return values and returned the final offset. If the version used here has that behavior, returning a negative result from `pathAbsolute` does not make the outer `if_fail_fe` detect that failure or stop iteration. The original captured-result guard still suppressed subsequent work under that iteration behavior. The revised batch function therefore requires either an iterator that propagates failures or explicit iteration that checks each single-path result. The contract of the version actually used must be verified.

**Positive results for skipped inputs.** Empty input and a caught filesystem error now return `1`, whereas the original recorded `-1`. Under the negative-means-failure convention, these are nonfatal outcomes. This is appropriate if invalid inputs are intentionally skipped, but it changes the original failure policy. The batch function also returns `0` after nonnegative iteration results, so it does not itself report how many inputs were skipped.

**Output state after an append failure.** The original constructs `normalized` before inserting it into the output collection. The revision inserts an empty entry first and appends into that entry. If the append fails, the newly inserted entry remains unless another layer removes it; its contents depend on the append operation's failure guarantees. This changes the output's failure-state contract, even though it makes direct construction in the destination possible.

**Explicit narrowing of the root length.** The revised `u2_c` declaration casts the string length to `u2_t`. This makes the chosen representation visible but introduces a range assumption that the original inferred type did not impose at that point. That assumption is independent of the decomposition and scope improvements.

The case illustrates how naming, placement, early exits, compact delegation, and limited scopes can work together. It also shows why a readability improvement and preservation of runtime behavior should be evaluated as separate questions.

## Case study: diagnostic context from a failing check

This excerpt is taken from an actual debugger log of `dedup.exe`. The four selected lines preserve their original text and order; intervening module-load and thread-exit messages are omitted.

```text
3|1790289595280|D:\dev_extras\llb\llt\dedup\dedup_main.cpp(234){collectExactMatches}:compareFileContents execution time: 0.044247 seconds.
3|1790289595294|D:\dev_extras\llb\llt\dedup\dedup_main.cpp(402){executeDedup}:Duplicated large files found: 142
3|1790289595297|D:\dev_extras\llb\llt\dedup\dedup_main.cpp(404){executeDedup}:::llc::failed((llc::argsOptionValue(appState.CommandLineArgs, "move", appState.TargetFolder)))
The program '[22432] dedup.exe' has exited with code 0 (0x0).
```

The excerpt connects several levels of evidence:

- **Progress and timing:** the comparison timing is followed by the program's report of 142 duplicated large files.
- **Source location:** the next diagnostic identifies `dedup_main.cpp(404)` and `executeDedup`.
- **Severity:** the leading `3` denotes the informational log level. The failed check is reported as information, not as an application error.
- **The failing expression:** `::llc::failed((llc::argsOptionValue(appState.CommandLineArgs, "move", appState.TargetFolder)))` identifies the option lookup and its arguments without requiring a separately written explanation at the call site.
- **Process outcome:** the debugger subsequently reports exit code `0`. Together with the informational severity, this supports interpreting the failed lookup as an intended, nonfatal outcome.

The expression identifies retrieval of the `"move"` option after duplicate comparison. A checked operation can fail without the program failing: the selected logging and control-flow policy determines how that result is handled. Here, informational severity and successful process termination are consistent with an expected nonfatal path. The excerpt does not identify the precise reason the lookup failed, such as an absent option.

`Failed to read option` says what failed in broad terms. This logging machinery goes further: it reproduces the failed expression, including the destination argument, alongside the source file, line, and calling function. The diagnostic points directly to the code that produced it, without requiring a separate explanation at the call site. A compact check therefore retains detailed runtime evidence. This is rules 10, 11, and 13 working together: check locally, reuse a recognizable failure policy, and preserve the code and context of the failure.

That one diagnostic line performs the first step of an investigation: it identifies the failing call. In ordinary production work, a programmer is not already sitting at that line when the failure occurs. Without the expression and source location, someone has to report the problem, reach a debugging-capable programmer, and let them switch context and prepare to inspect it. The programmer must then search the code, reproduce the failure, or use a debugger to recover information the log could have supplied immediately.

For budgeting, count **one such incident as at least half an hour of a debugging-capable programmer's paid time** just to locate the failing call. That is an experience-based production planning estimate, not a measured duration from this run. Unfamiliar code or difficult reproduction can extend the work to days, and every new incident can repeat the expense. The diagnostic removes this locating work; determining *why* the option lookup failed remains a separate task.

Published production reports show why the labor and repetition matter. In [Spotify's review of its 2021 Spotify for Artists incidents](https://engineering.atspotify.com/2022/5/failing-forward-how-we-grow-from-incidents), **55%** involved at least one responder spending the better part of a day addressing the problem. In [one documented Spotify outage](https://engineering.atspotify.com/2023/02/incident-report-spotify-outage-on-january-14-2023/), engineers were alerted at 00:40 UTC and identified the root cause at 02:00 UTC: **80 minutes** before identification, followed by further mitigation and recovery. [GitHub reported eight incidents in July 2026](https://github.blog/news-insights/company-news/github-availability-report-july-2026/) and [five in August 2026](https://github.blog/news-insights/company-news/github-availability-report-august-2026/). The cost of investigation recurs across a system's lifetime; it is not confined to one exceptional failure.

I have also seen a four-digit bug count in a company bug tracker firsthand. The count alone does not say how many tickets required this specific kind of source tracing, but it shows the scale at which repeated costs must be considered. As an illustrative budget calculation, if 10% of 1,000 tickets each avoided half an hour of call-location work, that would recover **50 hours of debugging-capable programmer time**. The 10% is a scenario assumption, not a measured fraction from that tracker.

These reports measure broader incident work or elapsed time, not the minutes saved by this particular logging expression. They also show why a half-hour figure is a planning assumption rather than a universal timing rule: in [Cloudflare's February 2026 incident timeline](https://blog.cloudflare.com/cloudflare-outage-february-20-2026/), the specialist team was paged at 18:21 UTC and the issue was identified at 18:46 UTC, a 25-minute interval; engineers had already been engaged at 18:13 UTC. The report does not give total person-hours. A source-rich diagnostic cannot resolve every failure, but it can remove the repeated task of finding which call emitted the report.
