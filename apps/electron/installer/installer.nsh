; ============================================================================
; Custom NSIS overrides injected by electron-builder.
;
; electron-builder splices `!insertmacro customHeader` into the top of its
; generated installer script (see
; node_modules/app-builder-lib/templates/nsis/installer.nsi around line 45),
; which is AFTER `common.nsh` is included. That makes this macro the right
; place to override directives like `Name`, `Caption`, `BrandingText`.
;
; Note on FileDescription: we intentionally do NOT override it here.
; electron-builder's `NsisTarget.computeVersionKey()` (app-builder-lib ->
; out/targets/nsis/NsisTarget.js) unconditionally emits
;   VIAddVersionKey /LANG=1033 "FileDescription" "${appInfo.description}"
; from `apps/electron/app/package.json`'s `description`. Any customHeader
; VIAddVersionKey targeting the same LANG+key triggers a hard NSIS error
; ("already defined!") that `-WX` does not gate. Different LANG (e.g. 0)
; produces a `warning 9100: without standard key FileVersion` which IS
; gated by -WX and still fails the build.
;
; The installer's FileDescription is rewritten post-build via `app-builder
; rcedit` in `afterAllArtifactBuild` (see apps/electron/scripts/build.ts).
; That sidesteps the NSIS constraint and lets the installer and app
; binary carry distinct descriptions (like VS Code / Chrome's Inno Setup
; default of "{AppName} Setup").
;
; Wired up through `nsis.include` in apps/electron/scripts/build.ts.
; ============================================================================

!macro customHeader
  ; ---------------------------------------------------------------------
  ; Surface the version in the installer's title bar.
  ;
  ; electron-builder's common.nsh sets `Name "${PRODUCT_NAME}"`, from
  ; which NSIS derives the default `$(^SetupCaption)` (e.g. "Setup -
  ; mediago-community"). That caption omits the version — users had to
  ; look at the gray BrandingText at the bottom-left to see which
  ; release they were installing.
  ;
  ; Why `Caption` and not `Name`: re-setting `Name` emits
  ; `warning 6029: Name: specified multiple times`, and electron-builder
  ; compiles NSIS with `-WX` (warnings-as-errors), so the build fails.
  ;
  ; Why a plain literal and not `$(^SetupCaption)`: the localized lang
  ; string is evaluated at runtime via the MUI plugin. electron-builder
  ; compiles an intermediate installer with `-DBUILD_UNINSTALLER` and
  ; executes it silently (NsisTarget.js line ~370, `execWine(installerPath,
  ; ..., __COMPAT_LAYER=RunAsInvoker)`) just to extract the uninstaller.
  ; Evaluating a language string in the `Caption` directive during that
  ; silent pass crashes with STATUS_STACK_BUFFER_OVERRUN (exit 3221225725)
  ; and aborts the whole packaging. A plain literal sidesteps the MUI
  ; runtime call entirely, so the intermediate pass finishes cleanly.
  ; Trade-off: title bar reads "Setup - mediago-community 3.5.0" in every
  ; locale instead of the translated "Installazione di ..." — acceptable.
  ; ---------------------------------------------------------------------
  Caption "Setup - ${PRODUCT_NAME} ${VERSION}"
!macroend
