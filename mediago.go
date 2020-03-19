package main

import (
	"bufio"
	"flag"
	"fmt"
	"net/url"
	"os"
	"path"
	"strings"
)

var segmentList []string

func main() {

	filename := flag.String("filename", "", "is ok")
	urlString := flag.String("url", "", "is ok")
	flag.Parse()

	fileHandle, _ := os.Open(*filename)
	defer fileHandle.Close()
	fileScanner := bufio.NewScanner(fileHandle)

	for fileScanner.Scan() {
		text := fileScanner.Text()
		switch {
		case strings.HasPrefix(text, "#EXT"):
		case strings.HasPrefix(text, "#"):
			continue
		default:
			segmentList = append(segmentList, text)
		}
	}

	for _, segmentName := range segmentList {

		var (
			u   *url.URL
			err error
		)

		if u, err = url.Parse(*urlString); err != nil {
			panic("invalid url")
		}

		u.Path = path.Join(u.Path, segmentName)
		newFileName := fmt.Sprintf("C:\\Users\\admin\\Desktop\\test\\%s", segmentName)
		fullUrl := u.String()

		fmt.Println("Download Started")
		err = DownloadFile(newFileName, fullUrl)
		if err != nil {
			panic(err)
		}
		fmt.Println("Download Finished")
	}

}
