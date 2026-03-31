package util

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func GracefulShutdown(fn func(ctx context.Context) error) {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = fn(ctx)
}
