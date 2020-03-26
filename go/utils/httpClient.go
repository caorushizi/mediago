package utils

import (
	"io"
	"net/http"
)

func HttpClient(url string) (repReader io.ReadCloser, err error) {
	// 初始化变量
	var (
		client *http.Client
		req    *http.Request
		resp   *http.Response
	)

	// 创建 http client
	client = &http.Client{}
	if req, err = http.NewRequest("GET", url, nil); err != nil {
		return
	}
	req.Header.Add("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36")
	if resp, err = client.Do(req); err != nil {
		return
	}
	repReader = resp.Body
	return
}
