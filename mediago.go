package main

import (
	"flag"
	"fmt"
	"mediago/downloader"
	"mediago/m3u8"
	"mediago/scheduler"
	"os"
	"path"
	"syscall"
)

func main() {
	urlString := flag.String("url", "", "m3u8 文件 url")
	local := flag.String("local", "", "下载根目录")
	flag.Parse()

	var err error

	// 检查下载路径是否存在
	// 并且检查时候有权限写入文件
	fileInfo, err := os.Stat(*local)
	if err != nil && os.IsNotExist(err) && !fileInfo.IsDir() {
		return
	}
	if err = syscall.Access(*local, syscall.O_RDWR); err != nil {
		return
	}

	var (
		sc       scheduler.Scheduler
		playlist m3u8.Playlist
	)
	// 开始初始化下载器
	if sc, err = scheduler.New(5); err != nil {
		panic(err)
	}
	// 开始初始化解析器
	if playlist, err = m3u8.New(*urlString); err != nil {
		panic(err)
	}

	// 分发的下载线程
	go func() {
		for _, segmentUrl := range playlist.Segments {
			sc.Chs <- 1 // 限制线程数 （每次下载缓存加1， 直到加满阻塞）
			sc.Add(1)

			filePath := path.Join(*local, path.Base(segmentUrl.Path))
			go func(localPath string, urlString string) {
				sc.Work(func() (err error) {
					if err = downloader.StartDownload(filePath, urlString); err != nil {
						return
					}
					return
				})
			}(*local, segmentUrl.String())
		}
		sc.Wait()     // 等待所有分发出去的线程结束
		close(sc.Ans) // 否则 range 会报错哦
	}()

	// 静静的等待每个下载完成
	for range sc.Ans {
		sc.Success++
		fmt.Printf("总共%d个，已经下载%d个~\n", len(playlist.Segments), sc.Success)
	}

}
