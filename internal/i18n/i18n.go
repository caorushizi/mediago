package i18n

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

// LangContextKey is the gin.Context key for the resolved language.
const LangContextKey = "i18n.lang"

// DefaultLang is the fallback language when none is resolved.
const DefaultLang = "en"

// catalogs maps language codes to translation maps.
var catalogs = map[string]map[string]string{
	"en": {
		// Common
		MsgOK:        "OK",
		MsgDeleted:   "Deleted",
		MsgImported:  "Imported",
		MsgInvalidID: "invalid id",

		// Auth
		MsgUnauthorized:     "unauthorized",
		MsgAPIKeyRequired:   "apiKey is required",
		MsgAPIKeyAlreadySet: "apiKey is already configured",
		MsgInvalidAPIKey:    "invalid apiKey",

		// Task
		MsgTaskCreated:          "Task created successfully",
		MsgTaskEnqueued:         "Task enqueued successfully",
		MsgTaskNotFound:         "task not found",
		MsgTaskStopped:          "Task stopped",
		MsgTaskLogNotConfigured: "task log storage not configured",
		MsgTaskLogNotFound:      "task log not found",
		MsgTaskLogReadFailed:    "failed to read task log",

		// Download
		MsgDownloadStarted: "Download started",
		MsgDownloadStopped: "Download stopped",
		MsgStatusUpdated:   "Status updated",

		// Config
		MsgConfigUpdated:    "Config updated",
		MsgConfigKeyUpdated: "Config key '%s' updated",

		// Util
		MsgURLRequired: "url parameter is required",

		// Favorite
		MsgURLAlreadyExists: "URL already exists",

		// Event
		MsgEventStreamFailed: "Failed to create event stream",

		// Core
		MsgUnsupportedType: "unsupported download type",
		MsgBinNotFound:     "binary not found for type",

		// DB
		MsgVideoNotFound:      "video with id %d not found",
		MsgConversionNotFound: "conversion with id %d not found",
	},
	"zh": {
		// Common
		MsgOK:        "操作成功",
		MsgDeleted:   "已删除",
		MsgImported:  "已导入",
		MsgInvalidID: "无效 ID",

		// Auth
		MsgUnauthorized:     "未授权",
		MsgAPIKeyRequired:   "请提供 apiKey",
		MsgAPIKeyAlreadySet: "apiKey 已配置",
		MsgInvalidAPIKey:    "apiKey 无效",

		// Task
		MsgTaskCreated:          "任务创建成功",
		MsgTaskEnqueued:         "任务已加入队列",
		MsgTaskNotFound:         "任务未找到",
		MsgTaskStopped:          "任务已停止",
		MsgTaskLogNotConfigured: "任务日志存储未配置",
		MsgTaskLogNotFound:      "任务日志未找到",
		MsgTaskLogReadFailed:    "读取任务日志失败",

		// Download
		MsgDownloadStarted: "下载已开始",
		MsgDownloadStopped: "下载已停止",
		MsgStatusUpdated:   "状态已更新",

		// Config
		MsgConfigUpdated:    "配置已更新",
		MsgConfigKeyUpdated: "配置键 '%s' 已更新",

		// Util
		MsgURLRequired: "缺少 url 参数",

		// Favorite
		MsgURLAlreadyExists: "URL 已存在",

		// Event
		MsgEventStreamFailed: "创建事件流失败",

		// Core
		MsgUnsupportedType: "不支持的下载类型",
		MsgBinNotFound:     "未找到对应类型的可执行文件",

		// DB
		MsgVideoNotFound:      "未找到 ID 为 %d 的视频",
		MsgConversionNotFound: "未找到 ID 为 %d 的转换记录",
	},
}

// T translates a message key using the language stored in gin.Context.
// Optional args are passed to fmt.Sprintf if the translated template contains placeholders.
func T(c *gin.Context, key string, args ...any) string {
	lang := Lang(c)
	return TLang(lang, key, args...)
}

// TLang translates a message key for the given language string.
func TLang(lang, key string, args ...any) string {
	catalog, ok := catalogs[lang]
	if !ok {
		catalog = catalogs[DefaultLang]
	}

	msg, ok := catalog[key]
	if !ok {
		// Fall back to English, then to raw key
		if enMsg, ok := catalogs[DefaultLang][key]; ok {
			msg = enMsg
		} else {
			msg = key
		}
	}

	if len(args) > 0 {
		return fmt.Sprintf(msg, args...)
	}
	return msg
}

// Lang returns the resolved language string from gin.Context.
func Lang(c *gin.Context) string {
	if v, exists := c.Get(LangContextKey); exists {
		if lang, ok := v.(string); ok && lang != "" {
			return lang
		}
	}
	return DefaultLang
}

// SupportedLanguages returns all supported language codes.
func SupportedLanguages() []string {
	langs := make([]string, 0, len(catalogs))
	for k := range catalogs {
		langs = append(langs, k)
	}
	return langs
}
