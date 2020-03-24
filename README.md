HLS 视频下载
========

> 主要是下载 m3u8 类型的播放列表文件

更新日志
----

v0.0.1 -- 2020年3月24日

- 可视化操作（当前支持mac）
- m3u8 播放列表文件下载
- 并发下载资源文件

PS: windows下需要使用命令行工具使用

编译说明
----
> 暂时不提供可执行文件，若要使用请参考「使用说明」。

环境要求：
- go 1.13.3 以上
- nodejs 12.16.1
- gcc


使用说明
----

- mac
```shell
git clone https://github.com/caorushizi/mediago.git
cd mediago
./scripts/start.sh
```
- windows

```shell
go build mediago.go
mediago -name "影片名称" -path "本地存储位置" -url "m3u8 文件 url" 
```






