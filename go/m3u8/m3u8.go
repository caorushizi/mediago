package m3u8

import (
	"bufio"
	"errors"
	"io"
	"mediago/utils"
	"net/url"
	"path"
	"regexp"
	"strings"
)

type ExtM3u8 struct {
	Name     string
	Content  string
	Url      *url.URL
	Segments []url.URL
}

func New(name string, urlString string) (playlist ExtM3u8, err error) {
	playlist.Name = name
	// 检查 url 是否正确
	if playlist.Url, err = url.Parse(urlString); err != nil {
		return
	}

	// 开始处理 http 请求
	var repReader io.ReadCloser
	if repReader, err = utils.HttpClient(urlString); err != nil {
		return
	}
	defer repReader.Close()

	// 文件扫描
	var (
		fileScanner *bufio.Scanner
		segments    []url.URL
	)
	fileScanner = bufio.NewScanner(repReader)

	// 解析第一行必须是 `#EXTM3U`
	fileScanner.Scan()
	text := fileScanner.Text()
	if text != "#EXTM3U" {
		err = errors.New("不是一个 m3u8 文件")
		return
	}

	var (
		extInfReg   = regexp.MustCompile("^EXTINF")
		commentsReg = regexp.MustCompile("^#[^EXT]")
	)

	for fileScanner.Scan() {
		text := fileScanner.Text()
		switch {
		case extInfReg.MatchString(text):
			playlist.Content = playlist.Content + text + "\n"
		case strings.HasPrefix(text, "#EXT"):
			playlist.Content = playlist.Content + text + "\n"
		case commentsReg.MatchString(text):
			// 这一行是注释直接跳过
		default:
			// 拼接与 url
			tempUrl := *playlist.Url
			if path.IsAbs(text) {
				tempUrl.Path = text
			} else {
				tempBaseUrl := path.Dir(tempUrl.Path)
				tempUrl.Path = path.Join(tempBaseUrl, text)
			}

			localContent := path.Join(playlist.Name, path.Base(tempUrl.Path))
			playlist.Content = playlist.Content + localContent + "\n"

			segments = append(segments, tempUrl)
		}
	}

	playlist.Segments = segments
	return
}

func (m3u *ExtM3u8) Parse() {

}
func parseTag() {

}
func parseAttr() {

}
