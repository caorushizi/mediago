package api

import (
	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/api/server"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/db"
	"caorushizi.cn/mediago/internal/tasklog"
)

// ServerOptions re-exports server.Options for external use.
type ServerOptions = server.Options

// NewServer 创建 HTTP 服务器实例。
// database 可为 nil，此时仅提供队列管理功能，不提供数据库持久化。
func NewServer(queue *core.TaskQueue, logs *tasklog.Manager, database *db.Database, confStore handler.ConfigStore, opts ...ServerOptions) *server.Server {
	return server.New(queue, logs, database, confStore, opts...)
}
