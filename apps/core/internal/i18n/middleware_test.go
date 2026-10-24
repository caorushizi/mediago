package i18n

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestMiddlewarePrefersAcceptLanguageOverConfig(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(Middleware(func() string { return "en" }))
	engine.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, Lang(c))
	})

	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.Header.Set("Accept-Language", "it-IT,it;q=0.9")
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)

	if got, want := response.Body.String(), "it"; got != want {
		t.Fatalf("resolved language = %q, want %q", got, want)
	}
}

func TestMiddlewareNormalizesSystemConfigToFallback(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(Middleware(func() string { return "system" }))
	engine.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, Lang(c))
	})

	request := httptest.NewRequest(http.MethodGet, "/", nil)
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)

	if got, want := response.Body.String(), DefaultLang; got != want {
		t.Fatalf("resolved language = %q, want %q", got, want)
	}
}

func TestMiddlewareBoundsLanguageInputsBeforeParsing(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, test := range []struct{ name, query, header, config, want string }{
		{"normal header", "", "it-IT,it;q=0.9", "en", "it"},
		{"normal query", "zh", "it", "en", "zh"},
		{"header at limit", "", "it" + strings.Repeat(" ", 254), "zh", "it"},
		{"oversized header", "", "it" + strings.Repeat(" ", 255), "zh", "zh"},
		{"large header", "", "it" + strings.Repeat(" ", 64*1024), "zh", "zh"},
		{"oversized query", "it" + strings.Repeat(" ", 64), "it", "zh", "it"},
		{"query wins over oversized header", "it", strings.Repeat("z", 1024), "zh", "it"},
		{"oversized config", "", "", strings.Repeat("z", 1024), "en"},
		{"invalid query", "!", "it", "zh", "en"},
	} {
		t.Run(test.name, func(t *testing.T) {
			engine := gin.New()
			engine.Use(Middleware(func() string { return test.config }))
			engine.GET("/", func(c *gin.Context) { c.String(http.StatusOK, Lang(c)) })
			request := httptest.NewRequest(http.MethodGet, "/?lang="+url.QueryEscape(test.query), nil)
			request.Header.Set("Accept-Language", test.header)
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, request)
			if response.Code != http.StatusOK || response.Body.String() != test.want {
				t.Fatalf("language = %q, status=%d; want %q", response.Body.String(), response.Code, test.want)
			}
		})
	}
}
