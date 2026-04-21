# aria2

Pre-compiled aria2c static binaries bundled with MediaGo.

| Field    | Value                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Version  | 1.19.0                                                                     |
| Upstream | https://github.com/aria2/aria2                                             |
| License  | GPL-2.0-or-later (SPDX: `GPL-2.0-or-later`)                                |
| Source   | https://github.com/aria2/aria2/releases/tag/release-1.19.0                 |
| Role     | Backs `DownloadType: "direct"` (replaces gopeed from v3.5.0-beta.2 onward) |

## Layout

```
extra/aria2/
├── darwin/arm64/aria2c
├── darwin/x64/aria2c
├── linux/arm64/aria2c
├── linux/x64/aria2c
├── win32/arm64/aria2c.exe
└── win32/x64/aria2c.exe
```

The wrapping deps pipeline (`scripts/download-deps.ts`) copies the correct
per-platform binary into `.deps/<os>-<arch>/aria2c[.exe]` on `pnpm deps:download`,
so the Go Core's `BinaryNames[TypeDirect] = "aria2c"` lookup finds it at the
same location that third-party tools (ffmpeg, N_m3u8DL-RE, BBDown, yt-dlp) land.

## License notice

aria2 is licensed under the GNU General Public License, version 2 or any
later version (GPL-2.0-or-later). The MediaGo project itself is MIT-licensed;
aria2 is redistributed here as an **aggregation** — MediaGo invokes `aria2c`
as a separate subprocess, not as a linked library, which keeps the GPL
boundary at the binary.

The full GPL text ships with each binary (run `aria2c --version` to see the
copyright notice) and is available at:
https://github.com/aria2/aria2/blob/master/COPYING

### Written offer (GPL-2.0 §3(b))

For any version of aria2 bundled here, the corresponding machine-readable
source code is publicly available at the upstream GitHub repository linked
above, at no charge. No further steps required from users.

## How to refresh these binaries

1. Fetch the new version's static builds from a trusted static-build
   distributor (the originals bundled here are from the aria2 GitHub
   releases on Windows; other platforms use static builds).
2. Replace each `extra/aria2/<os>/<arch>/aria2c[.exe]` file.
3. Update the **Version** and **Source** rows above.
4. Run `pnpm deps:download` locally to refresh `.deps/` and smoke-test a
   direct download.
