# RGB final code: snapshot review

This review concerns the final files in the archive, independently of commit count, chronology, or video duration. The snapshot contains two related pieces:

- `rgb_tutorial`: the evolving demonstrations, ending in an integrated BitBlt example.
- `rgblib`: the extracted reusable library, only 224 physical source lines across four implementation/header files.

## What the final code achieved

The result is substantially more than a collection of drawing experiments. The code has crossed the boundary from a one-file tutorial into a small, recognizable platform:

```text
Win32 messages -> SWindow event queue -> application logic
                                  |
                         caller-owned pixel buffer
                                  |
                 raster callback -> presentation with BitBlt
```

The reusable center is visible in [`rgb_coord.h`](D:/dev_extras/evidence/rgb-archive/rgblib/rgb_coord.h) and [`rgb_window.h`](D:/dev_extras/evidence/rgb-archive/rgblib/rgb_window.h). Rasterization accepts a callback instead of owning a canvas, so the caller can choose its storage and combine the same geometry with different outputs. The final tutorial's [`bitblt.cpp`](D:/dev_extras/evidence/rgb-archive/rgb_tutorial/bitblt/bitblt.cpp) then demonstrates that design with a pixel buffer, event handling, color selection, circles, line segments, and a Windows presentation path.

That is a meaningful architectural transition: the tutorial discovers the abstractions, then the library keeps the useful ones. It also explains why the final code can remain small while supporting several demonstrations. A conventional approach would often duplicate a window loop and drawing state in every sample; this code factors the common mechanism and leaves each example focused on the next experiment.

## Concrete strengths in the finished snapshot

### Callback-based raster operations

`rasterCircle`, `rasterRectangle`, and `rasterSegment` write through a callback rather than allocating an image internally:

```cpp
const auto setPixel = [&](const ::rgb::SCoord & coord) {
    pixels[coord.x + window.Size.x * coord.y] = color;
    return 0;
};
::rgb::rasterCircle(circle, setPixel);
```

This preserves caller ownership of storage, permits custom buffers, and keeps geometry independent from presentation. A more common beginner implementation would make the rasterizer own a global bitmap or reach directly into a window API.

### State is composed explicitly

`SWindow` contains the handle, size, event queue, and mouse position. The application keeps its pixel buffer and drawing state separately. That is direct composition rather than a deep class hierarchy: the data needed by an operation is visible at the call boundary.

### The final tutorial shows progressive reuse

The sequence moves from direct `SetPixel` calls to a reusable raster library and finally to a DIB section plus `BitBlt`. The visual examples are therefore also evidence of refactoring pressure being used productively: once per-pixel window calls became limiting, the storage and presentation path were separated.

### The library stays small

The extracted library is compact enough to understand as a whole. Its small size is not because it lacks an API; it comes from keeping the API narrow: coordinates, raster operations, window events, and presentation.

## What still marks it as prototype code

The final snapshot is a strong tutorial/prototype foundation, but it is not yet production-hardened. The main gaps are concrete and fixable.

### Header ownership is incomplete

`rgb_coord.h` has a commented-out `#pragma once`, and `rgb_window.h` has no visible include guard. Including either header more than once can break compilation. The coordinate header also relies on transitive declarations for `sqrt` instead of including the header that owns it.

### Event payloads are type-erased too early

`SWindowEvent::Data` is a `std::vector<char>`, and mouse coordinates are written and read through pointer reinterpretation. That makes the event protocol dependent on size, alignment, and aliasing assumptions. A typed event payload, or a small tagged structure with `memcpy` for serialization, would preserve the same compact design while making the contract explicit.

### Win32 failures are mostly ignored

Window registration, window creation, device-context acquisition, compatible-DC creation, DIB creation, and `BitBlt` are used without checking their return values. The library returns success even when one of those operations fails. The author's later `if_fail_*` vocabulary would make these paths both shorter and more diagnosable.

### Presentation resources are recreated per frame

`windowPresent()` obtains a device context and creates a compatible DC, bitmap, and DIB section on every call. That is easy to understand in a demo, but repeated allocation and destruction belongs in setup/cleanup state for a real renderer. The same issue appears in the integrated BitBlt example.

### Raster writes need a defined boundary policy

The callback examples index the pixel buffer directly from generated coordinates. There is no general clipping or bounds check at the raster-library boundary. A circle or line extending outside the window can therefore write outside the caller's storage. The library should either clip, require a checked callback, or state the in-bounds precondition explicitly.

### Public headers pull in platform and library dependencies

`rgb_window.h` includes Windows headers, `vector`, and `queue`, and exposes `HWND` and `WNDCLASS` in `SWindow`. This is acceptable for a Windows tutorial, but it makes every consumer inherit the platform dependency. A later split could keep the event and coordinate types platform-neutral and put Win32 handles in an implementation-owned structure.

### The examples retain experimental duplication

The tutorial folders preserve earlier versions of the same concepts. That is valuable evidence of evolution, but it means the archive's total source is larger than the final reusable design. The library is the better measure of the final abstraction; the tutorial is the better measure of the route used to discover it.

## Assessment

Judged as a finished learning-and-prototyping codebase, the final snapshot is successful: it demonstrates a complete path from native window creation to event processing, software rasterization, caller-owned storage, and efficient-ish presentation, while extracting a reusable library in a few hundred lines.

Judged as production code, it still needs include guards, typed event data, error propagation, resource lifetime management, and clipping. Those are implementation-hardening tasks rather than evidence that the architecture failed. The important design decisions are already present: explicit state, narrow reusable operations, callback-based output, and separation between drawing and presentation.

The fairest comparison is therefore not “finished product versus finished product.” It is “small, coherent final core versus a conventional tutorial that remains a pile of demos.” On that comparison, the final RGB code has a clear and defensible structure, even though several edges remain intentionally rough.
