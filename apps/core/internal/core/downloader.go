// Package core 包含下载器服务实现
package core

import (
	"context"
	"errors"
	"path/filepath"
	"strings"

	"caorushizi.cn/mediago/internal/core/parser"
	"caorushizi.cn/mediago/internal/core/schema"
	"caorushizi.cn/mediago/internal/logger"
	"go.uber.org/zap"
)

var (
	ErrUnsupportedType = errors.New("unsupported download type")
	ErrBinNotFound     = errors.New("binary not found for type")
)

// DownloaderSvc 下载器服务
type DownloaderSvc struct {
	binMap  map[DownloadType]string // 下载类型到可执行文件路径的映射
	runner  Runner                  // 命令执行器
	schemas schema.SchemaList       // Schema 配置列表
	tracker *parser.ProgressTracker // 进度节流器
	cfg     interface{}             // AppConfig
}

// NewDownloader 创建下载器服务实例
func NewDownloader(binMap map[DownloadType]string, runner Runner, schemas schema.SchemaList, cfg interface{}) *DownloaderSvc {
	return &DownloaderSvc{
		binMap:  binMap,
		runner:  runner,
		schemas: schemas,
		tracker: parser.NewTracker(),
		cfg:     cfg,
	}
}

func (d *DownloaderSvc) Config() interface{} {
	return d.cfg
}

// buildArgs 根据 Schema 构建命令行参数
func (d *DownloaderSvc) buildArgs(p DownloadParams, s schema.Schema) []string {
	var out []string

	// pushKV 辅助函数：将键值对展开到参数列表
	pushKV := func(keys []string, val string) {
		for _, k := range keys {
			out = append(out, k, val)
		}
	}

	// 遍历 Schema 中的参数映射
	for key, spec := range s.Args {
		switch key {
		case "url":
			// URL 参数：先添加参数名，再添加 URL 值
			if len(spec.ArgsName) > 0 {
				out = append(out, spec.ArgsName...)
			}
			out = append(out, p.URL)

		case "localDir":
			// 本地目录参数：可能需要拼接子文件夹
			final := d.cfg.(interface{ GetLocalDir() string }).GetLocalDir()
			if p.Folder != "" {
				final = filepath.Join(final, p.Folder)
			}
			pushKV(spec.ArgsName, final)

		case "name":
			// 文件名参数：处理后缀
			name := p.Name
			if spec.Postfix == "@@AUTO@@" {
				// 自动推断扩展名
				name = name + "." + guessExtFromURL(p.URL)
			} else if spec.Postfix != "" {
				// 添加指定后缀
				name = name + spec.Postfix
			}
			pushKV(spec.ArgsName, name)

		case "headers":
			// HTTP 头参数：多值展开
			for _, h := range p.Headers {
				for _, k := range spec.ArgsName {
					out = append(out, k, h)
				}
			}

		case "deleteSegments":
			// 删除分段文件参数：显式传递 true/false
			if d.cfg.(interface{ GetDeleteSegments() bool }).GetDeleteSegments() {
				pushKV(spec.ArgsName, "true")
			} else {
				pushKV(spec.ArgsName, "false")
			}

		case "proxy":
			// 代理参数：仅在设置时添加
			if d.cfg.(interface{ GetUseProxy() bool }).GetUseProxy() {
				if proxy := d.cfg.(interface{ GetProxy() string }).GetProxy(); proxy != "" {
					pushKV(spec.ArgsName, proxy)
				}
			}

		case "__common__":
			// 通用参数：直接展开
			out = append(out, spec.ArgsName...)
		}
	}

	return out
}


// guessExtFromURL 从 URL 推断文件扩展名
func guessExtFromURL(u string) string {
	l := strings.ToLower(u)
	switch {
	case strings.Contains(l, ".m3u8"):
		return "m3u8"
	case strings.Contains(l, ".mp4"):
		return "mp4"
	case strings.Contains(l, ".flv"):
		return "flv"
	case strings.Contains(l, ".mkv"):
		return "mkv"
	default:
		return "mp4"
	}
}

// Download 执行下载任务
func (d *DownloaderSvc) Download(ctx context.Context, p DownloadParams, cb Callbacks) error {
	logger.Info("Starting download task",
		zap.String("id", string(p.ID)),
		zap.String("type", string(p.Type)),
		zap.String("url", p.URL),
		zap.String("name", p.Name))

	// 获取对应下载类型的 Schema
	schema, ok := d.schemas.GetByType(string(p.Type))
	if !ok {
		logger.Error("Unsupported download type",
			zap.String("id", string(p.ID)),
			zap.String("type", string(p.Type)))
		return ErrUnsupportedType
	}

	// 获取对应下载类型的可执行文件路径
	bin, ok := d.binMap[p.Type]
	if !ok || bin == "" {
		logger.Error("Binary not found for download type",
			zap.String("id", string(p.ID)),
			zap.String("type", string(p.Type)))
		return ErrBinNotFound
	}

	logger.Debug("Using downloader binary",
		zap.String("id", string(p.ID)),
		zap.String("binary", bin))

	// 创建控制台行解析器
	lp, err := parser.NewLineParser(schema.ConsoleReg)
	if err != nil {
		logger.Error("Failed to create line parser",
			zap.String("id", string(p.ID)),
			zap.Error(err))
		return err
	}

	// 构建命令行参数
	args := d.buildArgs(p, schema)
	logger.Debug("Command arguments built",
		zap.String("id", string(p.ID)),
		zap.Strings("args", args))

	// 初始化解析状态
	st := &parser.ParseState{}

	// 逐行处理控制台输出
	onLine := func(line string) {
		line = strings.TrimSpace(line)

		// 发送消息事件
		if cb.OnMessage != nil {
			cb.OnMessage(MessageEvent{ID: p.ID, Message: line})
		}

		// 解析控制台输出
		evt, errStr := lp.Parse(line, st)
		if errStr != "" {
			logger.Warn("Parse error in download output",
				zap.String("id", string(p.ID)),
				zap.String("error", errStr))
		}

		// 处理 ready 事件
		if evt == "ready" {
			st.Ready = true
			logger.Info("Download ready",
				zap.String("id", string(p.ID)),
				zap.Bool("isLive", st.IsLive))
			if cb.OnProgress != nil {
				cb.OnProgress(ProgressEvent{
					ID:     p.ID,
					Type:   "ready",
					IsLive: st.IsLive,
				})
			}
		}

		// 处理进度更新（应用节流策略）
		if st.Ready && (st.Percent > 0 || st.Speed != "") {
			if cb.OnProgress != nil && d.tracker.ShouldUpdate(parser.TaskID(p.ID)) {
				logger.Debug("Download progress",
					zap.String("id", string(p.ID)),
					zap.Float64("percent", st.Percent),
					zap.String("speed", st.Speed))
				cb.OnProgress(ProgressEvent{
					ID:      p.ID,
					Type:    "progress",
					Percent: st.Percent,
					Speed:   st.Speed,
					IsLive:  st.IsLive,
				})
				d.tracker.Update(parser.TaskID(p.ID))
			}
		}
	}

	// 执行命令
	logger.Info("Executing download command",
		zap.String("id", string(p.ID)),
		zap.String("binary", bin))
	err = d.runner.Run(ctx, bin, args, onLine)

	// 清理进度记录
	d.tracker.Remove(parser.TaskID(p.ID))

	if err != nil {
		logger.Error("Download failed",
			zap.String("id", string(p.ID)),
			zap.Error(err))
		return err
	}

	logger.Info("Download completed successfully",
		zap.String("id", string(p.ID)))
	return nil
}
