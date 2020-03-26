package downloader

import (
	"io"
	"os"

	"mediago/utils"
)

func StartDownload(filepath string, url string) (err error) {
	var (
		respReader   io.ReadCloser
		downloadFile *os.File
	)

	if respReader, err = utils.HttpClient(url); err != nil {
		return
	}

	defer respReader.Close()

	if downloadFile, err = os.Create(filepath + ".tmp"); err != nil {
		return
	}

	counter := &WriteCounter{}
	if _, err = io.Copy(downloadFile, io.TeeReader(respReader, counter)); err != nil {
		downloadFile.Close()
		return err
	}

	downloadFile.Close()
	if err = os.Rename(filepath+".tmp", filepath); err != nil {
		return err
	}
	return
}
