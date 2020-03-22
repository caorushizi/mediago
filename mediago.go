package main

import (
	"flag"
	"fmt"
	"mediago/download"
)

type Workspace struct {
	Path string
}

func main() {

	playlist := flag.String("playlist", "", "is ok")
	urlString := flag.String("url", "", "is ok")
	baseFolder := flag.String("baseFolder", "", "is ok")
	flag.Parse()

	var (
		downloader download.Downloader
		err        error
	)
	if downloader, err = download.New(10, *baseFolder, *urlString); err != nil {
		panic(err)
	}
	// 初始化url
	if err := downloader.InitSegments(*playlist); err != nil {
		panic(err)
	}
	// 分发的下载线程
	go func() {
		for _, segment := range downloader.Segments {
			downloader.Chs <- 1 // 限制线程数 （每次下载缓存加1， 直到加满阻塞）
			downloader.Add(1)
			go downloader.Work(segment)
		}
		downloader.Wait()     // 等待所有分发出去的线程结束
		close(downloader.Ans) // 否则 range 会报错哦
	}()

	// 静静的等待每个下载完成
	for _ = range downloader.Ans {
		downloader.Success++
		fmt.Printf("总共%d个，已经下载%d个~\n", len(downloader.Segments), downloader.Success)
	}

}
