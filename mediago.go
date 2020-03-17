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
		case strings.HasPrefix(text, "#"):
			continue
		case strings.HasPrefix(text, "#EXT"):
		default:
			u, err := url.Parse(*urlString)
			if err != nil {
				panic("invalid url")
			}

			u.Path = path.Join(u.Path, text)
			newFileName := fmt.Sprintf("C:\\Users\\admin\\Desktop\\test\\%s", text)

			fmt.Println("Download Started")
			err = DownloadFile(newFileName, u.String())
			if err != nil {
				panic(err)
			}
			fmt.Println("Download Finished")

		}
	}

}
