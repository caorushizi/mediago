// Package schema 包含 Schema 配置加载逻辑
package schema

import (
	"encoding/json"
	"os"

	"caorushizi.cn/mediago/internal/logger"
	"go.uber.org/zap"
)

// ArgSpec 参数规格定义
type ArgSpec struct {
	ArgsName []string `json:"argsName"`          // 命令行参数名列表
	Postfix  string   `json:"postfix,omitempty"` // 后缀（如 @@AUTO@@ 表示自动推断扩展名）
}

// ConsoleReg 控制台输出正则表达式配置
type ConsoleReg struct {
	Percent string `json:"percent"` // 进度百分比正则
	Speed   string `json:"speed"`   // 下载速度正则
	Error   string `json:"error"`   // 错误标识正则
	Start   string `json:"start"`   // 开始下载标识正则
	IsLive  string `json:"isLive"`  // 直播流标识正则
}

// Schema 下载类型的配置模式
type Schema struct {
	Type       string             `json:"type"`       // 下载类型
	Args       map[string]ArgSpec `json:"args"`       // 参数映射表
	ConsoleReg ConsoleReg         `json:"consoleReg"` // 控制台解析规则
}

// SchemaList Schema 列表容器
type SchemaList struct {
	Schemas []Schema `json:"schemas"` // 所有下载类型的 Schema
}

// GetByType 根据下载类型获取对应的 Schema
func (sl SchemaList) GetByType(t string) (Schema, bool) {
	for _, s := range sl.Schemas {
		if s.Type == t {
			return s, true
		}
	}
	return Schema{}, false
}

// DefaultSchemas 返回内置的默认 Schema 配置，与 Node.js 端 config.json 保持一致。
func DefaultSchemas() SchemaList {
	return SchemaList{
		Schemas: []Schema{
			{
				Type: "m3u8",
				Args: map[string]ArgSpec{
					"url":            {ArgsName: []string{}},
					"localDir":       {ArgsName: []string{"--tmp-dir", "--save-dir"}},
					"name":           {ArgsName: []string{"--save-name"}},
					"headers":        {ArgsName: []string{"--header"}},
					"deleteSegments": {ArgsName: []string{"--del-after-done"}},
					"proxy":          {ArgsName: []string{"--custom-proxy"}},
					"__common__":     {ArgsName: []string{"--no-log", "--auto-select", "--ui-language", "zh-CN", "--live-real-time-merge", "--check-segments-count", "false"}},
				},
				ConsoleReg: ConsoleReg{
					Percent: `([\d.]+)%`,
					Speed:   `([\d.]+[GMK]Bps)`,
					Error:   "ERROR",
					Start:   "保存文件名:",
					IsLive:  "检测到直播流",
				},
			},
			{
				Type: "bilibili",
				Args: map[string]ArgSpec{
					"url":        {ArgsName: []string{}},
					"localDir":   {ArgsName: []string{"--work-dir"}},
					"name":       {ArgsName: []string{"--file-pattern"}},
					"__common__": {ArgsName: []string{"--use-app-api"}},
				},
				ConsoleReg: ConsoleReg{
					Percent: `([\d.]+)%`,
					Speed:   `([\d.]+\s[GMK]B/s)`,
					Error:   "ERROR",
					Start:   "开始下载",
					IsLive:  "检测到直播流",
				},
			},
			{
				Type: "direct",
				Args: map[string]ArgSpec{
					"localDir":   {ArgsName: []string{"-D"}},
					"name":       {ArgsName: []string{"-N"}, Postfix: "@@AUTO@@"},
					"url":        {ArgsName: []string{}},
					"__common__": {ArgsName: []string{"-x", "16", "-s", "16", "-k", "1M"}},
				},
				ConsoleReg: ConsoleReg{
					Percent: `([\d.]+)%`,
					Speed:   `([\d.]+[GMK]B/s)`,
					Error:   "fail",
					Start:   "downloading...",
					IsLive:  "检测到直播流",
				},
			},
		},
	}
}

// LoadSchemasFromJSON 从 JSON 文件加载 Schema 配置。
// 如果文件不存在，返回内置默认值。
func LoadSchemasFromJSON(path string) (SchemaList, error) {
	logger.Debug("Loading schemas from file", zap.String("path", path))

	raw, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			logger.Info("Schema file not found, using built-in defaults",
				zap.String("path", path))
			return DefaultSchemas(), nil
		}
		logger.Error("Failed to read schema file",
			zap.String("path", path),
			zap.Error(err))
		return SchemaList{}, err
	}

	var sl SchemaList
	if err := json.Unmarshal(raw, &sl); err != nil {
		logger.Error("Failed to parse schema JSON",
			zap.String("path", path),
			zap.Error(err))
		return SchemaList{}, err
	}

	logger.Info("Schemas loaded successfully",
		zap.String("path", path),
		zap.Int("count", len(sl.Schemas)))

	return sl, nil
}
