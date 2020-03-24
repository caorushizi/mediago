rem enter go folder.
cd ../go

go build -buildmode c-archive -o ../lib/mediago.a mediago.go

rem enter root folder.
cd ..
node-gyp rebuild

rem start electron.
electron .
