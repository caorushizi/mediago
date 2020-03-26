package m3u8

import "testing"

func TestM3U8Parser_ParseUrl(t *testing.T) {
	var (
		err      error
		playlist ExtM3u8
	)

	url := "https://www.yxlmbbs.com:65/20200318/6PnR6gn6/1500kb/hls/index.m3u8"

	if playlist, err = New("test", url); err != nil {
		t.Error(err)
	}

	if len(playlist.Segments) == 0 {
		t.Error("列表解析出错")
	}

	for _, item := range playlist.Segments {
		t.Log(item.String())
	}

}
