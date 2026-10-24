package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"caorushizi.cn/mediago/internal/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type bootstrapConfig struct {
	values map[string]any
	fail   bool
}

func (s *bootstrapConfig) Get(key string) any              { return s.values[key] }
func (s *bootstrapConfig) Set(key string, value any) error { s.values[key] = value; return nil }
func (s *bootstrapConfig) Store() any                      { return s.values }
func (s *bootstrapConfig) Update(update map[string]any) error {
	if s.fail {
		return errors.New("controlled persistence failure")
	}
	for k, v := range update {
		s.values[k] = v
	}
	return nil
}

func authTestEngine(h *AuthHandler) *gin.Engine {
	engine := gin.New()
	engine.POST("/setup", h.Setup)
	engine.POST("/signin", h.Signin)
	return engine
}
func authTestRequest(engine http.Handler, path string, body map[string]string) *httptest.ResponseRecorder {
	payload, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	res := httptest.NewRecorder()
	engine.ServeHTTP(res, req)
	return res
}

func TestSetupRateLimitExpiresWithoutTrustingForwardedHeaders(t *testing.T) {
	store := &bootstrapConfig{values: map[string]any{}}
	handler := NewAuthHandler(store, AuthOptions{RequireSetupToken: true, SetupToken: "operator-proof"})
	now := time.Now()
	handler.now = func() time.Time { return now }
	engine := authTestEngine(handler)
	for i := 0; i < authAttemptsPerMinute; i++ {
		res := authTestRequest(engine, "/setup", map[string]string{"password": "owner-password", "setupToken": "wrong"})
		if res.Code != http.StatusForbidden {
			t.Fatalf("attempt%d status=%d", i, res.Code)
		}
	}
	res := authTestRequest(engine, "/setup", map[string]string{"password": "owner-password", "setupToken": "wrong"})
	if res.Code != http.StatusTooManyRequests || res.Header().Get("Retry-After") == "" {
		t.Fatal("setup attempts were not bounded")
	}
	now = now.Add(time.Minute + time.Second)
	if res := authTestRequest(engine, "/setup", map[string]string{"password": "owner-password", "setupToken": "wrong"}); res.Code != http.StatusForbidden {
		t.Fatalf("invalid-proof budget did not reset: %d", res.Code)
	}
	if res := authTestRequest(engine, "/setup", map[string]string{"password": "owner-password", "setupToken": "operator-proof"}); res.Code != http.StatusOK {
		t.Fatalf("owner remains blocked after rate window: %d", res.Code)
	}
}

func TestSigninRateLimitsBcryptWork(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("owner-password"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	store := &bootstrapConfig{values: map[string]any{"passwordHash": string(hash), "apiKey": "existing-owner-key"}}
	handler := NewAuthHandler(store)
	engine := authTestEngine(handler)
	for i := 0; i < authAttemptsPerMinute; i++ {
		if res := authTestRequest(engine, "/signin", map[string]string{"password": "wrong"}); res.Code != http.StatusUnauthorized {
			t.Fatalf("attempt%d status=%d", i, res.Code)
		}
	}
	if res := authTestRequest(engine, "/signin", map[string]string{"password": "owner-password"}); res.Code != http.StatusTooManyRequests {
		t.Fatal("password attempts were not bounded")
	}
}

func TestSetupDoesNotConsumeProofOnPersistenceFailure(t *testing.T) {
	previous, previousSugar := logger.Logger, logger.Sugar
	logger.Logger = zap.NewNop()
	logger.Sugar = logger.Logger.Sugar()
	t.Cleanup(func() { logger.Logger = previous; logger.Sugar = previousSugar })
	store := &bootstrapConfig{values: map[string]any{}, fail: true}
	h := NewAuthHandler(store, AuthOptions{RequireSetupToken: true, SetupToken: "operator-proof"})
	engine := authTestEngine(h)
	body := map[string]string{"password": "owner-password", "setupToken": "operator-proof"}
	if res := authTestRequest(engine, "/setup", body); res.Code != http.StatusInternalServerError {
		t.Fatalf("persistence failure status=%d", res.Code)
	}
	if len(store.values) != 0 {
		t.Fatal("credentials changed after persistence failure")
	}
	store.fail = false
	if res := authTestRequest(engine, "/setup", body); res.Code != http.StatusOK {
		t.Fatal("owner cannot retry after storage recovery")
	}
}

func TestAuthenticationRejectsOversizedBodiesAndPasswords(t *testing.T) {
	store := &bootstrapConfig{values: map[string]any{}}
	engine := authTestEngine(NewAuthHandler(store))
	for _, password := range []string{strings.Repeat("a", 73), strings.Repeat("a", authBodyLimit+1), strings.Repeat("界", 25)} {
		for _, path := range []string{"/setup", "/signin"} {
			if res := authTestRequest(engine, path, map[string]string{"password": password}); res.Code != http.StatusBadRequest {
				t.Fatalf("%s accepted oversized password: %d", path, res.Code)
			}
		}
	}
	if len(store.values) != 0 {
		t.Fatal("invalid requests changed credentials")
	}
}

func TestValidBootstrapProofIsNotLockedOutByInvalidAttempts(t *testing.T) {
	store := &bootstrapConfig{values: map[string]any{}}
	h := NewAuthHandler(store, AuthOptions{RequireSetupToken: true, SetupToken: "operator-proof"})
	engine := authTestEngine(h)
	for range authAttemptsPerMinute {
		if res := authTestRequest(engine, "/setup", map[string]string{"password": "owner-password", "setupToken": "wrong"}); res.Code != http.StatusForbidden {
			t.Fatalf("invalid proof status=%d", res.Code)
		}
	}
	if res := authTestRequest(engine, "/setup", map[string]string{"password": "owner-password", "setupToken": "operator-proof"}); res.Code != http.StatusOK {
		t.Fatalf("operator proof was locked out by invalid attempts: status=%d", res.Code)
	}
}
