//go:build !dev

package http

import "github.com/gin-gonic/gin"

func registerSwagger(_ *gin.Engine) {}
