!include "LogicLib.nsh"
!include "Win\COM.nsh"

!define MEDIAGO_INSTALLER_INCLUDE_DIR "${__FILEDIR__}"

!macro customHeader
  BrandingText "Copyright ${PRODUCT_NAME}"

  !ifndef BUILD_UNINSTALLER
    ; Caption writes ^SetupCaption itself: referring to it from Caption recurses.
    !include "${MEDIAGO_INSTALLER_INCLUDE_DIR}\languages.nsh"
    !undef APP_DESCRIPTION
    !define APP_DESCRIPTION "$(MediaGoAppDescription)"
  !endif
!macroend

!ifndef BUILD_UNINSTALLER
  ; Load and save the existing link so arguments, icons and AppUserModelID survive.
  Function MediaGoUpdateShortcutDescription
    Exch $0
    Push $1
    Push $2
    Push $3

    ${If} ${FileExists} "$0"
      StrCpy $1 0
      StrCpy $2 0
      !insertmacro ComHlpr_CreateInProcInstance ${CLSID_ShellLink} ${IID_IShellLink} r1 ".r3"
      ${If} $3 = 0
        ${IUnknown::QueryInterface} $1 '("${IID_IPersistFile}",.r2).r3'
        ${If} $3 = 0
          ${IPersistFile::Load} $2 '("$0",2).r3'
          ${If} $3 = 0
            ${IShellLink::SetDescription} $1 '("$(MediaGoAppDescription)").r3'
            ${If} $3 = 0
              ${IPersistFile::Save} $2 '("$0",1).r3'
            ${EndIf}
          ${EndIf}
          ${IUnknown::Release} $2 ""
        ${EndIf}
        ${IUnknown::Release} $1 ""
      ${EndIf}
      ${If} $3 != 0
        DetailPrint "Could not update shortcut description: $0 ($3)"
      ${EndIf}
    ${EndIf}

    Pop $3
    Pop $2
    Pop $1
    Pop $0
  FunctionEnd

  !macro customInstall
    ; Upgrades normally keep shortcuts, skipping electron-builder's CreateShortCut.
    Push "$newStartMenuLink"
    Call MediaGoUpdateShortcutDescription
    Push "$newDesktopLink"
    Call MediaGoUpdateShortcutDescription
  !macroend
!endif
