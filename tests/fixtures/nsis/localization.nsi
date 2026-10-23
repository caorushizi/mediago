Unicode true
Name "${PRODUCT_NAME}"
OutFile "${OUTPUT_FILE}"
RequestExecutionLevel user
VIProductVersion "3.6.0.0"
VIAddVersionKey /LANG=1033 "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey /LANG=1033 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=1033 "FileDescription" "${APP_DESCRIPTION}"
VIAddVersionKey /LANG=1033 "LegalCopyright" "MediaGo test"
!addplugindir /x86-unicode "${PLUGIN_DIR}"
!include "MUI2.nsh"
!include "${INSTALLER_INCLUDE}"
!ifndef BUILD_UNINSTALLER
Var newStartMenuLink
Var newDesktopLink
!endif
!ifndef BUILD_UNINSTALLER
  !insertmacro customPageAfterChangeDir
  !insertmacro MUI_PAGE_INSTFILES
!else
  SilentInstall silent
!endif
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "German"
!insertmacro MUI_LANGUAGE "French"
!insertmacro MUI_LANGUAGE "SpanishInternational"
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "TradChinese"
!insertmacro MUI_LANGUAGE "Japanese"
!insertmacro MUI_LANGUAGE "Korean"
!insertmacro MUI_LANGUAGE "Italian"
!insertmacro MUI_LANGUAGE "Dutch"
!insertmacro MUI_LANGUAGE "Danish"
!insertmacro MUI_LANGUAGE "Swedish"
!insertmacro MUI_LANGUAGE "Norwegian"
!insertmacro MUI_LANGUAGE "Finnish"
!insertmacro MUI_LANGUAGE "Russian"
!insertmacro MUI_LANGUAGE "Portuguese"
!insertmacro MUI_LANGUAGE "PortugueseBR"
!insertmacro MUI_LANGUAGE "Polish"
!insertmacro MUI_LANGUAGE "Ukrainian"
!insertmacro MUI_LANGUAGE "Czech"
!insertmacro MUI_LANGUAGE "Slovak"
!insertmacro MUI_LANGUAGE "Hungarian"
!insertmacro MUI_LANGUAGE "Arabic"
!insertmacro MUI_LANGUAGE "Turkish"
!insertmacro MUI_LANGUAGE "Thai"
!insertmacro MUI_LANGUAGE "Vietnamese"
!insertmacro customHeader
Function .onInit
  StrCpy $LANGUAGE ${TEST_LANGUAGE}
  !ifdef BUILD_UNINSTALLER
    WriteUninstaller "${UNINSTALLER_FILE}"
    SetErrorLevel 0
    Quit
  !endif
FunctionEnd
Section
  !ifndef BUILD_UNINSTALLER
    SetOutPath "${TEST_DIRECTORY}"
    StrCpy $newStartMenuLink "${TEST_DIRECTORY}\start.lnk"
    StrCpy $newDesktopLink "${TEST_DIRECTORY}\desktop.lnk"
    !ifndef TEST_MISSING_LINKS
      !ifdef TEST_UPGRADE
        !define TEST_LINK_DESCRIPTION "Previous English description"
      !else
        !define TEST_LINK_DESCRIPTION "${APP_DESCRIPTION}"
      !endif
      CreateShortCut "$newStartMenuLink" "$SYSDIR\cmd.exe" "/c echo preserved" "$SYSDIR\shell32.dll" 7 SW_SHOWMINIMIZED "" "${TEST_LINK_DESCRIPTION}"
      CreateShortCut "$newDesktopLink" "$SYSDIR\cmd.exe" "/c echo preserved" "$SYSDIR\shell32.dll" 7 SW_SHOWMINIMIZED "" "${TEST_LINK_DESCRIPTION}"
      WinShell::SetLnkAUMI "$newStartMenuLink" "mediago.test.preserved"
      WinShell::SetLnkAUMI "$newDesktopLink" "mediago.test.preserved"
    !endif
    !ifdef TEST_ANALYTICS_DECISION
      StrCpy $MediaGoAnalyticsSelectionMade 1
      StrCpy $MediaGoAnalyticsChoice "${TEST_ANALYTICS_DECISION}"
    !endif
    !insertmacro customInstall
    FileOpen $9 "${TEST_DIRECTORY}\strings.txt" w
    FileWriteUTF16LE /BOM $9 "$(^SetupCaption)$\r$\n$(^Branding)$\r$\n$(MediaGoAppDescription)$\r$\n"
    FileClose $9
    WriteUninstaller "${UNINSTALLER_FILE}"
  !endif
SectionEnd
Section "Uninstall"
  FileOpen $9 "${TEST_DIRECTORY}\uninstalled.txt" w
  FileWrite $9 "uninstaller completed"
  FileClose $9
SectionEnd
