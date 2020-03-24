# 进入 go 源码文件夹
cd ../go || exit
pwd

echo ""
go build -buildmode c-archive -o ../lib/mediago.a mediago.go || exit

# 进入 gyp 文件夹
echo ""
cd ..
pwd
npm install || exit

# 启动客户端
electron .
