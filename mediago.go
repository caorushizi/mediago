package main

import (
	"flag"
	"mediago/download"
)

func main() {

	filename := flag.String("filename", "", "is ok")
	urlString := flag.String("url", "", "is ok")
	flag.Parse()

	downloader := download.New(5)
	// 初始化url
	downloader.InitUrl(*filename)
	// 分发的下载线程
	go func() {
		for _, segment := range downloader.Segments {
			downloader.Chs <- 1 // 限制线程数 （每次下载缓存加1， 直到加满阻塞）
			downloader.Wg.Add(1)
			go downloader.Work(segment, *urlString)
		}
		downloader.Wg.Wait()  // 等待所有分发出去的线程结束
		close(downloader.Ans) // 否则range 会报错哦
	}()

	// 静静的等待每个下载完成
	for _ = range downloader.Ans {
	}

}
