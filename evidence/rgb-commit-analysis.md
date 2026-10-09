# RGB / Computación Gráfica commit evidence

Originally inspected from an archive of the [`rgb_tutorial`](https://github.com/RGBVillain/rgb_tutorial) and [`rgblib`](https://github.com/RGBVillain/rgblib) Git histories. The measured snapshots correspond to commits `a74eb2b` and `0498405`, respectively. Source counts include tracked `.cpp`, `.h`, `.c` and `.hpp` files and count physical lines, including comments and blanks.

## `rgb_tutorial`

- 14 commits.
- First commit: `fc9eb7b`, July 22, 2022 00:06:03 −03:00, “Initial commit”.
- Last commit: `a74eb2b`, September 3, 2022 01:05:07 −03:00, project-configuration correction.
- Elapsed first-to-last timestamp span: **43 days, 59 minutes, 4 seconds**.
- Current tracked C/C++ source snapshot: **16 files, 1,477 physical lines**.

The feature sequence in the commit subjects is:

| Commit | Date | Subject |
| --- | --- | --- |
| `fc9eb7b` | Jul 22 | Initial commit |
| `7679f7d` | Jul 22 | Window tutorial |
| `4d33a64` | Jul 30 | Mouse example |
| `9427d96` | Jul 31 | Comments |
| `72d3fce` | Jul 31 | Event project |
| `4387282` | Aug 2 | Circle project files |
| `9de7222` | Aug 6 | Raster project files |
| `544c8cd` | Aug 6 | Namespace project files |
| `a411301` | Aug 6 | Dependency project files |
| `c080a30` | Aug 12 | Line project files |
| `7002264` | Aug 18 | BitBlt project files |
| `8db3993` | Aug 18 | Redraw project files |
| `f722e12` | Sep 3 | Pixel-center project files |
| `a74eb2b` | Sep 3 | Project-configuration correction |

The subjects align closely with the 11-video playlist: windowing, mouse input, events, circles, rasterization, namespace and library reuse, lines, canvas presentation, redraw, and pixel-size compensation. The repository therefore provides source-history corroboration for the playlist’s conceptual progression.

## `rgblib`

- 3 commits.
- First commit: `778640e`, August 6, 2022 22:55:08 −03:00.
- Last commit: `0498405`, September 3, 2022 00:59:31 −03:00.
- Elapsed span: **27 days, 2 hours, 4 minutes, 23 seconds**.
- Current tracked C/C++ source snapshot: **4 files, 224 physical lines**.
- Subjects: initial library, enclosing-rectangle correction for `rasterCircle`, and promotion of `rasterSegment()` and `windowPresent()`.

## Interpretation

This is better evidence than a playlist alone. It shows the implementation sequence and the extraction of reusable library operations into `rgblib`. It still measures repository chronology, not uninterrupted hands-on hours: the gaps include breaks, recording preparation, and work that may not have been committed immediately. The strongest supported statement is that a 1,477-line tutorial snapshot and a 224-line extracted library emerged through a clearly ordered series over roughly six weeks, with the source subjects matching the recorded architectural progression.
