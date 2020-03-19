package main

import (
	"flag"
	"mediago/download"
)

func main() {

	filename := flag.String("filename", "", "is ok")
	urlString := flag.String("url", "", "is ok")
	flag.Parse()

	end := make(chan bool)
	u := download.Urls{
		Chs: make(chan int, 5), // 默认同时下载5个
		Ans: make(chan bool),
	}
	// 初始化url
	go u.InitUrl(end, *filename)
	if ok := <-end; ok {
		// 分发的下载线程
		go func() {
			for _, v := range u.Urls {
				u.Chs <- 1 // 限制线程数 （每次下载缓存加1， 直到加满阻塞）
				u.Wg.Add(1)
				go u.Work(v, *urlString)
			}
			u.Wg.Wait()  // 等待所有分发出去的线程结束
			close(u.Ans) // 否则range 会报错哦
		}()

		// 静静的等待每个下载完成
		for _ = range u.Ans {
		}
	}

}
