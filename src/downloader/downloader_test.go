package downloader

import (
	"net/url"
	"path"
	"testing"
)

func TestStartDownload(t *testing.T) {
	var (
		u   *url.URL
		err error
	)

	baseDir := "/Users/caorushizi/Desktop"
	urlString := "https://www.yxlmbbs.com:65/20200219/qj2nG87p/1500kb/hls/EmJlkWNm.ts"

	if u, err = url.Parse(urlString); err != nil {
		t.Error(err)
	}

	filePath := path.Join(baseDir, path.Base(u.Path))

	if err = StartDownload(filePath, u.String()); err != nil {
		t.Error(err)
	}
}
