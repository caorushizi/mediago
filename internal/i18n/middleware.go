package i18n

import (
	"github.com/gin-gonic/gin"
	"golang.org/x/text/language"
)

// supported language tags for the matcher.
var (
	supported = []language.Tag{
		language.English,            // index 0, fallback
		language.SimplifiedChinese,  // index 1
	}
	matcher = language.NewMatcher(supported)

	// tagToCode maps matched tags to our catalog keys.
	tagToCode = map[language.Tag]string{
		language.English:           "en",
		language.SimplifiedChinese: "zh",
	}
)

// Middleware resolves the request language and stores it in gin.Context.
//
// Resolution priority:
//  1. Query parameter ?lang=zh
//  2. Accept-Language header
//  3. Config store language setting (via getConfigLang callback)
//  4. Fallback to DefaultLang ("en")
func Middleware(getConfigLang func() string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Query parameter
		if lang := c.Query("lang"); lang != "" {
			c.Set(LangContextKey, resolveCode(lang))
			c.Next()
			return
		}

		// 2. Accept-Language header
		if accept := c.GetHeader("Accept-Language"); accept != "" {
			tags, _, _ := language.ParseAcceptLanguage(accept)
			if len(tags) > 0 {
				tag, _, _ := matcher.Match(tags...)
				if code, ok := tagToCode[tag]; ok {
					c.Set(LangContextKey, code)
					c.Next()
					return
				}
			}
		}

		// 3. Config store
		if getConfigLang != nil {
			if configLang := getConfigLang(); configLang != "" {
				c.Set(LangContextKey, configLang)
				c.Next()
				return
			}
		}

		// 4. Fallback
		c.Set(LangContextKey, DefaultLang)
		c.Next()
	}
}

// resolveCode normalizes a language string to a catalog key ("en" or "zh").
func resolveCode(lang string) string {
	tag, err := language.Parse(lang)
	if err != nil {
		return DefaultLang
	}
	matched, _, _ := matcher.Match(tag)
	if code, ok := tagToCode[matched]; ok {
		return code
	}
	return DefaultLang
}
