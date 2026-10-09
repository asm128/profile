# Repository history scope and counts

This page records the exact repository snapshots behind the homepage history metrics. The snapshot was taken on **8 October 2026**.

Each recorded revision matched its local `origin/master` reference at the time of measurement, so the linked GitHub commit and source views identify the same public snapshot.

Each commit count is the number of commits reachable from the recorded `HEAD`, including merge commits. The span is the earliest through latest **committer date** among those reachable commits. Non-merge counts are shown separately so merge policy is visible.

The source-file count describes the recorded revision, not the current working tree. It includes tracked files with C, C++, header, inline or assembly extensions and excludes paths under `zlib`, `ThirdParty_NotMine`, third-party, external, vendor, `.vs`, `.pio` and `obj` directories. The project count is the number of tracked `.vcxproj` files at that revision.

| Repository | Recorded revision | Reachable commits | Non-merge commits | Committer-date span | Tracked source files | Visual Studio projects | Public sources |
| --- | --- | ---: | ---: | --- | ---: | ---: | --- |
| `gpk` | [`eea402f`](https://github.com/asm128/gpk/commit/eea402f5c323fd3eaa792b0ed66dfb3849ad1a94) | **1,277** | 1,257 | 2018-05-18 – 2026-10-06 | 403 | 24 | [history](https://github.com/asm128/gpk/commits/eea402f5c323fd3eaa792b0ed66dfb3849ad1a94) · [source](https://github.com/asm128/gpk/tree/eea402f5c323fd3eaa792b0ed66dfb3849ad1a94) |
| `gpk_samples` | [`af41122`](https://github.com/asm128/gpk_samples/commit/af411229f621fa63eb9d6b04f44a6ff87ac60ee6) | **333** | 328 | 2018-12-26 – 2026-09-20 | 165 | 34 | [history](https://github.com/asm128/gpk_samples/commits/af411229f621fa63eb9d6b04f44a6ff87ac60ee6) · [source](https://github.com/asm128/gpk_samples/tree/af411229f621fa63eb9d6b04f44a6ff87ac60ee6) |
| `gpk_games` | [`dcf8a56`](https://github.com/asm128/gpk_games/commit/dcf8a56e7470726a49c387729ecc1928989d4ccb) | **229** | 227 | 2022-09-04 – 2026-10-06 | 106 | 20 | [history](https://github.com/asm128/gpk_games/commits/dcf8a56e7470726a49c387729ecc1928989d4ccb) · [source](https://github.com/asm128/gpk_games/tree/dcf8a56e7470726a49c387729ecc1928989d4ccb) |
| `blitter` | [`d355599`](https://github.com/asm128/blitter/commit/d355599e1b8a06f0d4d0f3162dc9638743d0a637) | **122** | 122 | 2019-07-19 – 2026-10-08 | 12 | 5 | [history](https://github.com/asm128/blitter/commits/d355599e1b8a06f0d4d0f3162dc9638743d0a637) · [source](https://github.com/asm128/blitter/tree/d355599e1b8a06f0d4d0f3162dc9638743d0a637) |
| `llc` | [`f2c1c0c`](https://github.com/asm128/llc/commit/f2c1c0c406c19555a3caf20d8c05ab866808b390) | **91** | 90 | 2024-12-06 – 2026-10-08 | 199 | 10 | [history](https://github.com/asm128/llc/commits/f2c1c0c406c19555a3caf20d8c05ab866808b390) · [source](https://github.com/asm128/llc/tree/f2c1c0c406c19555a3caf20d8c05ab866808b390) |

## Interpretation limits

The five histories have no shared commit IDs at these revisions, but they are still presented separately rather than summed into one productivity number. Related repositories can share ideas, files and lineage without sharing commit IDs.

Commit counts show sustained, inspectable iteration. They do not measure code quality, difficulty, uninterrupted work time or unique code volume. The source and project counts give each history some present-day scale, while the linked snapshots let readers inspect what the numbers describe.
