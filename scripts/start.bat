chcp 65001

@echo off
@title 批处理判断文件夹是否存在

if not exist .bin md .bin

if not exist %cd%/.bin/mediago.exe (
    bitsadmin /transfer mediago http://static.ziying.site/mediago.exe %cd%/.bin/mediago.exe
)

if not exist %cd%/.bin/ffmpeg.exe (
    bitsadmin /transfer ffmpeg http://static.ziying.site/ffmpeg.exe %cd%/.bin/ffmpeg.exe
)

if not exist %cd%/.bin/N_m3u8DL-CLI_v2.9.5.exe (
    bitsadmin /transfer N_m3u8DL-CLI http://static.ziying.site/N_m3u8DL-CLI_v2.9.5.exe %cd%/.bin/N_m3u8DL-CLI_v2.9.5.exe
)
@echo on


npx cross-env NODE_ENV=development electron-forge start --inspect-electron
