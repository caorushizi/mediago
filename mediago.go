package main

import (
	"flag"
	"fmt"
	"os"
	"path"

	"mediago/downloader"
	"mediago/m3u8"
	"mediago/scheduler"
	"mediago/utils"
)

func main() {
	urlString := flag.String("url", "", "m3u8 文件 url")
	local := flag.String("local", "", "下载根目录")
	name := flag.String("name", "新影片", "视频文件的名称")
	flag.Parse()

	var err error

	if err = utils.CheckDirAndAccess(*local); err != nil {
		panic(err)
	}

	var (
		sc           scheduler.Scheduler
		playlist     m3u8.Playlist
		playlistFile *os.File
	)
	// 开始初始化下载器
	if sc, err = scheduler.New(5); err != nil {
		panic(err)
	}
	// 开始初始化解析器
	if playlist, err = m3u8.New(*name, *urlString); err != nil {
		panic(err)
	}

	pName := fmt.Sprintf("%s%s", *name, path.Ext(playlist.Url.Path))
	playlistName := path.Join(*local, pName)
	if playlistFile, err = os.Create(playlistName); err != nil {
		panic(err)
	}
	if _, err = playlistFile.Write([]byte(playlist.Content)); err != nil {
		panic(err)
	}

	return
	// 创建视频文件夹
	baseMediaPath := path.Join(*local, *name)
	if err = os.MkdirAll(baseMediaPath, os.ModePerm); err != nil {
		panic(err)
	}

	// 分发的下载线程
	go func() {
		for _, segmentUrl := range playlist.Segments {
			sc.Chs <- 1 // 限制线程数 （每次下载缓存加1， 直到加满阻塞）
			sc.Add(1)

			filePath := path.Join(baseMediaPath, path.Base(segmentUrl.Path))
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
