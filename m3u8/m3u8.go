package m3u8

import (
	"bufio"
	"net/http"
	"net/url"
	"path"
	"strings"
)

type Playlist struct {
	Url      *url.URL
	Segments []url.URL
}

func New(urlString string) (playlist Playlist, err error) {
	// 检查 url 是否正确
	if playlist.Url, err = url.Parse(urlString); err != nil {
		return
	}

	// 开始处理 http 请求
	var (
		client *http.Client
		req    *http.Request
		resp   *http.Response
	)
	client = &http.Client{}

	if req, err = http.NewRequest("GET", playlist.Url.String(), nil); err != nil {
		return
	}
	req.Header.Add("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36")

	if resp, err = client.Do(req); err != nil {
		return
	}
	defer resp.Body.Close()

	// 文件扫描
	var (
		fileScanner *bufio.Scanner
		segments    []url.URL
	)
	fileScanner = bufio.NewScanner(resp.Body)

	for fileScanner.Scan() {
		text := fileScanner.Text()
		switch {
		case strings.HasPrefix(text, "#EXTINF"):
			fileScanner.Scan() // 开始读下一行
			// 这一行就是 url 地址
			segment := fileScanner.Text()

			// 拼接与 url
			tempUrl := *playlist.Url
			if path.IsAbs(segment) {
				tempUrl.Path = segment
			} else {
				tempBaseUrl := path.Dir(tempUrl.Path)
				tempUrl.Path = path.Join(tempBaseUrl, segment)
			}

			segments = append(segments, tempUrl)
		case strings.HasPrefix(text, "#"):
		case strings.HasPrefix(text, "#EXT"):
		default:
		}
	}

	playlist.Segments = segments
	return
}
