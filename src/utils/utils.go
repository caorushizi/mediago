package utils

import (
	"os"
	"syscall"
)

func CheckDirAndAccess(pathString string) (err error) {
	// 检查下载路径是否存在
	// 并且检查时候有权限写入文件
	fileInfo, err := os.Stat(pathString)
	if err != nil && os.IsNotExist(err) && !fileInfo.IsDir() {
		return
	}
	if err = syscall.Access(pathString, syscall.O_RDWR); err != nil {
		return
	}
	return
}
