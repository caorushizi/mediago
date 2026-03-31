// Package logger 提供日志管理功能
// 支持同时输出到控制台和文件，自动日志轮转
package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	// Logger 全局日志实例
	Logger *zap.Logger
	// Sugar 便捷日志实例
	Sugar *zap.SugaredLogger
)

// Config 日志配置
type Config struct {
	// Level 日志级别: debug, info, warn, error
	Level string
	// LogDir 日志文件存储目录
	LogDir string
	// LogFileName 日志文件名
	LogFileName string
	// MaxSize 单个日志文件最大大小(MB)
	MaxSize int
	// MaxBackups 保留旧日志文件的最大数量
	MaxBackups int
	// MaxAge 保留旧日志文件的最大天数
	MaxAge int
	// Compress 是否压缩旧日志文件
	Compress bool
	// Console 是否输出到控制台
	Console bool
}

// DefaultConfig 返回默认配置
func DefaultConfig() Config {
	return Config{
		Level:       "info",
		LogDir:      "./logs",
		LogFileName: "mediago-core.log",
		MaxSize:     100,  // 100MB
		MaxBackups:  5,    // 保留5个备份
		MaxAge:      30,   // 30天
		Compress:    true, // 压缩旧日志
		Console:     true, // 输出到控制台
	}
}

// Init 初始化日志系统
func Init(cfg Config) error {
	// 创建日志目录
	if err := os.MkdirAll(cfg.LogDir, 0755); err != nil {
		return err
	}

	// 解析日志级别
	level := parseLevel(cfg.Level)

	// 配置编码器
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalColorLevelEncoder, // 彩色级别输出
		EncodeTime:     zapcore.ISO8601TimeEncoder,       // ISO8601 时间格式
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder, // 短路径格式
	}

	// 文件编码器配置(不使用彩色)
	fileEncoderConfig := encoderConfig
	fileEncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	// 控制台编码器(彩色输出)
	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
	// 文件编码器(JSON格式)
	fileEncoder := zapcore.NewJSONEncoder(fileEncoderConfig)

	// 配置日志写入：默认按天拆分
	fileWriter := zapcore.AddSync(newDailyRotateWriter(cfg))

	// 创建多个输出核心
	var cores []zapcore.Core

	// 文件输出核心
	cores = append(cores, zapcore.NewCore(fileEncoder, fileWriter, level))

	// 控制台输出核心
	if cfg.Console {
		consoleWriter := zapcore.Lock(os.Stdout)
		cores = append(cores, zapcore.NewCore(consoleEncoder, consoleWriter, level))
	}

	// 创建 logger
	core := zapcore.NewTee(cores...)
	Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
	Sugar = Logger.Sugar()

	return nil
}

// parseLevel 解析日志级别
func parseLevel(levelStr string) zapcore.Level {
	switch levelStr {
	case "debug":
		return zapcore.DebugLevel
	case "info":
		return zapcore.InfoLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

// Sync 刷新日志缓冲区
func Sync() {
	if Logger != nil {
		_ = Logger.Sync()
	}
	if Sugar != nil {
		_ = Sugar.Sync()
	}
}

// 便捷方法 - 结构化日志
func Debug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

func Info(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

func Fatal(msg string, fields ...zap.Field) {
	Logger.Fatal(msg, fields...)
}

// 便捷方法 - 格式化日志
func Debugf(template string, args ...interface{}) {
	Sugar.Debugf(template, args...)
}

func Infof(template string, args ...interface{}) {
	Sugar.Infof(template, args...)
}

func Warnf(template string, args ...interface{}) {
	Sugar.Warnf(template, args...)
}

func Errorf(template string, args ...interface{}) {
	Sugar.Errorf(template, args...)
}

func Fatalf(template string, args ...interface{}) {
	Sugar.Fatalf(template, args...)
}
