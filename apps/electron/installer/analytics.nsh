!include "nsDialogs.nsh"
!include "TextFunc.nsh"
!include "FileFunc.nsh"

Var MediaGoAnalyticsCheckbox
Var MediaGoAnalyticsSelectionMade
Var MediaGoAnalyticsChoice
Var MediaGoAnalyticsFile

Function MediaGoAnalyticsPath
  !ifdef MEDIAGO_ANALYTICS_TEST_FILE
    StrCpy $MediaGoAnalyticsFile "${MEDIAGO_ANALYTICS_TEST_FILE}"
  !else
    SetShellVarContext current
    StrCpy $MediaGoAnalyticsFile "$APPDATA\MediaGo\analytics-consent"
    ${If} $installMode == "all"
      SetShellVarContext all
    ${EndIf}
  !endif
FunctionEnd

Function MediaGoReadAnalyticsChoice
  Call MediaGoAnalyticsPath
  StrCpy $MediaGoAnalyticsChoice 0
  ClearErrors
  FileOpen $0 "$MediaGoAnalyticsFile" r
  ${IfNot} ${Errors}
    FileRead $0 $1 8
    FileClose $0
    ${TrimNewLines} $1 $1
    ${If} $1 == "1"
      StrCpy $MediaGoAnalyticsChoice 1
    ${EndIf}
  ${EndIf}
FunctionEnd

Function MediaGoOpenPrivacyPolicy
  Pop $0
  ExecShell "open" "https://downloader.caorushizi.cn/en/privacy.html"
FunctionEnd

Function MediaGoAnalyticsPageCreate
  IfSilent 0 +2
    Abort
  !ifdef isUpdated
    ${If} ${isUpdated}
      Abort
    ${EndIf}
  !endif
  Call MediaGoReadAnalyticsChoice
  !insertmacro MUI_HEADER_TEXT "$(MediaGoAnalyticsTitle)" "$(MediaGoAnalyticsSubtitle)"
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 0 100% 65u "$(MediaGoAnalyticsDetails)"
  Pop $0
  ${NSD_CreateCheckbox} 0 75u 100% 24u "$(MediaGoAnalyticsLabel)"
  Pop $MediaGoAnalyticsCheckbox
  ${If} $MediaGoAnalyticsChoice == "1"
    ${NSD_SetState} $MediaGoAnalyticsCheckbox ${BST_CHECKED}
  ${EndIf}
  ${NSD_CreateLink} 0 110u 100% 16u "$(MediaGoAnalyticsPrivacy)"
  Pop $0
  ${NSD_OnClick} $0 MediaGoOpenPrivacyPolicy
  nsDialogs::Show
FunctionEnd

Function MediaGoAnalyticsPageLeave
  ${NSD_GetState} $MediaGoAnalyticsCheckbox $MediaGoAnalyticsChoice
  StrCpy $MediaGoAnalyticsSelectionMade 1
FunctionEnd

Function MediaGoPersistAnalyticsChoice
  ; Silent/automatic updates must never grant or replace consent.
  ${If} $MediaGoAnalyticsSelectionMade != "1"
    Return
  ${EndIf}
  Call MediaGoAnalyticsPath
  ClearErrors
  ${GetParent} "$MediaGoAnalyticsFile" $0
  CreateDirectory "$0"
  FileOpen $0 "$MediaGoAnalyticsFile" w
  ${If} ${Errors}
    MessageBox MB_ICONSTOP "$(MediaGoAnalyticsSaveError)"
    Abort
  ${EndIf}
  FileWrite $0 "$MediaGoAnalyticsChoice"
  FileClose $0
  ${If} ${Errors}
    MessageBox MB_ICONSTOP "$(MediaGoAnalyticsSaveError)"
    Abort
  ${EndIf}
FunctionEnd

!macro customPageAfterChangeDir
  Page custom MediaGoAnalyticsPageCreate MediaGoAnalyticsPageLeave
!macroend

!macro MediaGoAnalyticsLanguage language
  !if ${language} == 2052
    LangString MediaGoAnalyticsTitle ${language} "可选的使用统计"
    LangString MediaGoAnalyticsSubtitle ${language} "不启用统计也可以正常使用 MediaGo。"
    LangString MediaGoAnalyticsDetails ${language} "TalkingData（北京腾云天下科技有限公司）可接收功能使用事件、应用版本及浏览器和网络信息，用于改进 MediaGo。首次安装默认关闭，勾选才启用。应用不会附带机器标识、任务 ID、下载链接或文件名。可在设置中随时关闭。"
    LangString MediaGoAnalyticsLabel ${language} "我同意启用 TalkingData 使用统计"
    LangString MediaGoAnalyticsPrivacy ${language} "阅读隐私政策（打开官网）"
    LangString MediaGoAnalyticsSaveError ${language} "无法保存统计偏好。安装已停止，请检查当前用户目录权限后重试。"
  !else if ${language} == 1040
    LangString MediaGoAnalyticsTitle ${language} "Statistiche facoltative"
    LangString MediaGoAnalyticsSubtitle ${language} "MediaGo funziona anche senza statistiche."
    LangString MediaGoAnalyticsDetails ${language} "TalkingData riceve eventi di utilizzo, versione e informazioni del browser e della rete per migliorare MediaGo. Disattivato alla prima installazione; seleziona per consentire. Non aggiungiamo ID macchina o attività, URL di download o nomi file agli eventi. Puoi disattivare nelle impostazioni."
    LangString MediaGoAnalyticsLabel ${language} "Consento le statistiche TalkingData"
    LangString MediaGoAnalyticsPrivacy ${language} "Leggi l'informativa sulla privacy (sito web)"
    LangString MediaGoAnalyticsSaveError ${language} "Impossibile salvare la preferenza. Installazione interrotta: controlla i permessi della cartella utente."
  !else
    LangString MediaGoAnalyticsTitle ${language} "Optional usage statistics"
    LangString MediaGoAnalyticsSubtitle ${language} "MediaGo works without statistics."
    LangString MediaGoAnalyticsDetails ${language} "TalkingData (Beijing Tendcloud) receives feature usage, app version and browser/network information to improve MediaGo. Off on a fresh install; check to agree. We do not attach machine/task IDs, download URLs or filenames to events. You can turn this off in Settings."
    LangString MediaGoAnalyticsLabel ${language} "I agree to TalkingData usage statistics"
    LangString MediaGoAnalyticsPrivacy ${language} "Read the privacy policy (opens website)"
    LangString MediaGoAnalyticsSaveError ${language} "Could not save the statistics preference. Installation stopped; check permissions in your user directory."
  !endif
!macroend
!insertmacro MediaGoAnalyticsLanguage 1033
!insertmacro MediaGoAnalyticsLanguage 1031
!insertmacro MediaGoAnalyticsLanguage 1036
!insertmacro MediaGoAnalyticsLanguage 3082
!insertmacro MediaGoAnalyticsLanguage 2052
!insertmacro MediaGoAnalyticsLanguage 1028
!insertmacro MediaGoAnalyticsLanguage 1041
!insertmacro MediaGoAnalyticsLanguage 1042
!insertmacro MediaGoAnalyticsLanguage 1040
!insertmacro MediaGoAnalyticsLanguage 1043
!insertmacro MediaGoAnalyticsLanguage 1030
!insertmacro MediaGoAnalyticsLanguage 1053
!insertmacro MediaGoAnalyticsLanguage 1044
!insertmacro MediaGoAnalyticsLanguage 1035
!insertmacro MediaGoAnalyticsLanguage 1049
!insertmacro MediaGoAnalyticsLanguage 2070
!insertmacro MediaGoAnalyticsLanguage 1046
!insertmacro MediaGoAnalyticsLanguage 1045
!insertmacro MediaGoAnalyticsLanguage 1058
!insertmacro MediaGoAnalyticsLanguage 1029
!insertmacro MediaGoAnalyticsLanguage 1051
!insertmacro MediaGoAnalyticsLanguage 1038
!insertmacro MediaGoAnalyticsLanguage 1025
!insertmacro MediaGoAnalyticsLanguage 1055
!insertmacro MediaGoAnalyticsLanguage 1054
!insertmacro MediaGoAnalyticsLanguage 1066
