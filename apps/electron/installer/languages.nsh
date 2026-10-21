; Title translations follow NSIS 3.0.4.1 Contrib/Language files (zlib license).
; Define the built-in string directly to avoid a self-referencing Caption.
!macro MediaGoLanguage language caption description
  LangString ^SetupCaption ${language} "${caption}"
  LangString MediaGoAppDescription ${language} "${description}"
!macroend

; English
!insertmacro MediaGoLanguage 1033 "$(^Name) ${VERSION} Setup" "${APP_DESCRIPTION}"
; German
!insertmacro MediaGoLanguage 1031 "Installation von $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; French
!insertmacro MediaGoLanguage 1036 "Installation de $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; SpanishInternational
!insertmacro MediaGoLanguage 3082 "Instalación de $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; SimpChinese
!insertmacro MediaGoLanguage 2052 "$(^Name) ${VERSION} 安装" "功能强大、易于使用的在线视频下载器"
; TradChinese
!insertmacro MediaGoLanguage 1028 "$(^Name) ${VERSION} 安裝" "功能強大、易於使用的線上影片下載器"
; Japanese
!insertmacro MediaGoLanguage 1041 "$(^Name) ${VERSION} セットアップ" "${APP_DESCRIPTION}"
; Korean
!insertmacro MediaGoLanguage 1042 "$(^Name) ${VERSION} 설치" "${APP_DESCRIPTION}"
; Italian
!insertmacro MediaGoLanguage 1040 "Installazione di $(^Name) ${VERSION}" "Un potente downloader di video online facile da usare"
; Dutch
!insertmacro MediaGoLanguage 1043 "$(^Name) ${VERSION}-installatie" "${APP_DESCRIPTION}"
; Danish
!insertmacro MediaGoLanguage 1030 "$(^Name) ${VERSION} Installation" "${APP_DESCRIPTION}"
; Swedish
!insertmacro MediaGoLanguage 1053 "$(^Name) ${VERSION} Installation" "${APP_DESCRIPTION}"
; Norwegian
!insertmacro MediaGoLanguage 1044 "$(^Name) ${VERSION} installasjon" "${APP_DESCRIPTION}"
; Finnish
!insertmacro MediaGoLanguage 1035 "$(^Name) ${VERSION} -ohjelman asennus" "${APP_DESCRIPTION}"
; Russian
!insertmacro MediaGoLanguage 1049 "Установка $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; Portuguese
!insertmacro MediaGoLanguage 2070 "Instalação de $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; PortugueseBR
!insertmacro MediaGoLanguage 1046 "Instalação do $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; Polish
!insertmacro MediaGoLanguage 1045 "Instalator $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; Ukrainian
!insertmacro MediaGoLanguage 1058 "$(^Name) ${VERSION} Встановлення" "${APP_DESCRIPTION}"
; Czech
!insertmacro MediaGoLanguage 1029 "Instalace $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; Slovak
!insertmacro MediaGoLanguage 1051 "Inštalácia programu $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; Hungarian
!insertmacro MediaGoLanguage 1038 "$(^Name) ${VERSION} Telepítő" "${APP_DESCRIPTION}"
; Arabic
!insertmacro MediaGoLanguage 1025 "تنصيب $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
; Turkish
!insertmacro MediaGoLanguage 1055 "$(^Name) ${VERSION} Kurulumu" "${APP_DESCRIPTION}"
; Thai
!insertmacro MediaGoLanguage 1054 "$(^Name) ${VERSION} ติดตั้ง" "${APP_DESCRIPTION}"
; Vietnamese
!insertmacro MediaGoLanguage 1066 "Cài đặt $(^Name) ${VERSION}" "${APP_DESCRIPTION}"
