package utils

import (
	"io/ioutil"
	"net/http"
)

func HttpClient(url string) (respBody []byte, err error) {
	client := &http.Client{}
	var req *http.Request
	if req, err = http.NewRequest("GET", url, nil); err != nil {
		return
	}
	req.Header.Add("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36")
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if respBody, err = ioutil.ReadAll(resp.Body); err != nil {
		return
	}
	return
}
