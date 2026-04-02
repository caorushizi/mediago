// Package logger provides log management functionality.
// Supports concurrent output to console and file with automatic log rotation.
package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	// Logger is the global logger instance.
	Logger *zap.Logger
	// Sugar is the convenience sugared logger instance.
	Sugar *zap.SugaredLogger
)

// Config holds the logger configuration.
type Config struct {
	// Level is the log level: debug, info, warn, error
	Level string
	// LogDir is the directory where log files are stored.
	LogDir string
	// LogFileName is the name of the log file.
	LogFileName string
	// MaxSize is the maximum size of a single log file in MB.
	MaxSize int
	// MaxBackups is the maximum number of old log files to retain.
	MaxBackups int
	// MaxAge is the maximum number of days to retain old log files.
	MaxAge int
	// Compress indicates whether to compress old log files.
	Compress bool
	// Console indicates whether to output logs to the console.
	Console bool
}

// DefaultConfig returns the default logger configuration.
func DefaultConfig() Config {
	return Config{
		Level:       "info",
		LogDir:      "./logs",
		LogFileName: "mediago-core.log",
		MaxSize:     100,  // 100MB
		MaxBackups:  5,    // retain 5 backups
		MaxAge:      30,   // 30 days
		Compress:    true, // compress old logs
		Console:     true, // output to console
	}
}

// Init initializes the logging system.
func Init(cfg Config) error {
	// Create the log directory
	if err := os.MkdirAll(cfg.LogDir, 0755); err != nil {
		return err
	}

	// Parse the log level
	level := parseLevel(cfg.Level)

	// Configure the encoder
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalColorLevelEncoder, // colored level output
		EncodeTime:     zapcore.ISO8601TimeEncoder,       // ISO8601 time format
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder, // short path format
	}

	// File encoder config (no color)
	fileEncoderConfig := encoderConfig
	fileEncoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder

	// Console encoder (colored output)
	consoleEncoder := zapcore.NewConsoleEncoder(encoderConfig)
	// File encoder (JSON format)
	fileEncoder := zapcore.NewJSONEncoder(fileEncoderConfig)

	// Configure log writer: split by day by default
	fileWriter := zapcore.AddSync(newDailyRotateWriter(cfg))

	// Create multiple output cores
	var cores []zapcore.Core

	// File output core
	cores = append(cores, zapcore.NewCore(fileEncoder, fileWriter, level))

	// Console output core
	if cfg.Console {
		consoleWriter := zapcore.Lock(os.Stdout)
		cores = append(cores, zapcore.NewCore(consoleEncoder, consoleWriter, level))
	}

	// Create the logger
	core := zapcore.NewTee(cores...)
	Logger = zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
	Sugar = Logger.Sugar()

	return nil
}

// parseLevel parses a log level string into a zapcore.Level.
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

// Sync flushes any buffered log entries.
func Sync() {
	if Logger != nil {
		_ = Logger.Sync()
	}
	if Sugar != nil {
		_ = Sugar.Sync()
	}
}

// Convenience methods - structured logging
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

// Convenience methods - formatted logging
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
