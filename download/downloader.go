package download

import (
	"bufio"
	"net/url"
	"os"
	"path"
	"strings"
	"sync"
	"syscall"
)

type Downloader struct {
	sync.WaitGroup

	Workspace string
	Region    *url.URL
	Segments  []string
	Chs       chan int  // 默认下载量
	Ans       chan bool // 每个进程的下载状态
	Success   int
}

// 创建新的下载器
func New(count int, workspace string, urlString string) (downloader Downloader, err error) {
	// 检查下载路径是否存在
	// 并且检查时候有权限写入文件
	fileInfo, err := os.Stat(workspace)
	if err != nil && os.IsNotExist(err) && !fileInfo.IsDir() {
		return
	}
	if err = syscall.Access(workspace, syscall.O_RDWR); err != nil {
		return
	}
	// 解析url参数是否正确
	var region *url.URL
	if region, err = url.Parse(urlString); err != nil {
		return
	}
	return Downloader{
		Region:    region,
		Workspace: workspace,
		Chs:       make(chan int, count),
		Ans:       make(chan bool),
	}, nil
}

// 初始化下载地址  根据项目确认使用配置文件的方式还是其他方式，此处使用爬虫处理没公开
func (downloader *Downloader) InitSegments(filename string) (err error) {
	var fileHandle *os.File
	if fileHandle, err = os.Open(filename); err != nil {
		return
	}

	defer fileHandle.Close()
	fileScanner := bufio.NewScanner(fileHandle)

	for fileScanner.Scan() {
		text := fileScanner.Text()
		switch {
		case strings.HasPrefix(text, "#EXT"):
		case strings.HasPrefix(text, "#"):
			continue
		default:
			downloader.Segments = append(downloader.Segments, text)
		}
	}
	return
}

/**
每个线程的操作
url 下载地址
chs 默认下载量
ans 每个线程的下载状态
*/
func (downloader *Downloader) Work(segmentPath string) {
	defer func() {
		<-downloader.Chs // 某个任务下载完成，让出
		downloader.Done()
	}()

	var filePath string
	var urlPath string

	if path.IsAbs(segmentPath) {
		urlPath = segmentPath
		filePath = path.Join(downloader.Workspace, path.Base(segmentPath))
	} else {
		regionPath := downloader.Region.Path
		urlPath = path.Join(regionPath, segmentPath)
		// fixme: 相对路径下本地文件的下载
		filePath = path.Join(downloader.Workspace, segmentPath)
	}

	//需要根据下载内容作存储等处理
	if err := StartDownload(filePath, urlPath); err != nil {
		// fixme: 处理下载时出现错误
		panic(err)
	}

	downloader.Ans <- true // 告知下载完成
}
