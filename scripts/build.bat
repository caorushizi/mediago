chcp 65001

rd /S /Q "./.bin/Logs"

npx cross-env NODE_ENV=production electron-forge make
