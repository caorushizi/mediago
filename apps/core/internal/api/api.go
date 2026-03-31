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

// NewServer creates an HTTP server instance.
// database may be nil, in which case only queue management is provided without database persistence.
func NewServer(queue *core.TaskQueue, logs *tasklog.Manager, database *db.Database, confStore handler.ConfigStore, opts ...ServerOptions) *server.Server {
	return server.New(queue, logs, database, confStore, opts...)
}
