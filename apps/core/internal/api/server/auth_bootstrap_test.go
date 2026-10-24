package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync"
	"sync/atomic"
	"testing"

	"caorushizi.cn/mediago/internal/api/handler"
	"caorushizi.cn/mediago/internal/core"
	"caorushizi.cn/mediago/internal/logger"
	"caorushizi.cn/mediago/pkg/conf"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

const operatorSetupProof = "test-operator-initialization-proof"

func newBootstrapServer(t *testing.T) (*Server, *conf.Conf[map[string]any]) {
	t.Helper()
	previous, previousSugar := logger.Logger, logger.Sugar
	logger.Logger = zap.NewNop()
	logger.Sugar = logger.Logger.Sugar()
	t.Cleanup(func() { logger.Logger = previous; logger.Sugar = previousSugar })
	store, err := conf.New(conf.Options[map[string]any]{CWD: t.TempDir(), Defaults: map[string]any{"language": "en"}})
	if err != nil {
		t.Fatal(err)
	}
	server := New(core.NewTaskQueue(nil, 1), nil, nil, handler.WrapConfStore[map[string]any](store), Options{EnableAuth: true, AuthSetupToken: operatorSetupProof})
	t.Cleanup(server.Close)
	return server, store
}

func bootstrapRequest(engine http.Handler, method, path string, body any, key string) *httptest.ResponseRecorder {
	var data io.Reader
	if body != nil {
		payload, _ := json.Marshal(body)
		data = bytes.NewReader(payload)
	}
	req := httptest.NewRequest(method, path, data)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if key != "" {
		req.Header.Set("X-API-Key", key)
	}
	res := httptest.NewRecorder()
	engine.ServeHTTP(res, req)
	return res
}

func TestBootstrapRejectsUnauthenticatedFetchesAndPreservesAuthenticatedLAN(t *testing.T) {
	var hits atomic.Int64
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		fmt.Fprint(w, "<title>local media server</title>")
	}))
	defer target.Close()
	server, store := newBootstrapServer(t)
	engine := server.Engine()
	for _, path := range []string{"/api/tasks", "/api/config", "/api/env", "/api/v1/videos", "/videos/1", "/api/url/title?url=" + target.URL} {
		response := bootstrapRequest(engine, http.MethodGet, path, nil, "")
		if response.Code != http.StatusUnauthorized {
			t.Fatalf("protected path %s status=%d", path, response.Code)
		}
	}
	for _, path := range []string{"/api/sources/inspect", "/api/tasks"} {
		res := bootstrapRequest(engine, http.MethodPost, path, map[string]string{"url": target.URL + "/stream.m3u8"}, "")
		if res.Code != http.StatusUnauthorized {
			t.Fatalf("uninitialized POST %s status=%d", path, res.Code)
		}
	}
	for _, proof := range []string{"", "wrong-proof"} {
		res := bootstrapRequest(engine, http.MethodPost, "/api/auth/setup", map[string]string{"password": "owner-password", "setupToken": proof}, "")
		if res.Code != http.StatusForbidden {
			t.Fatalf("unproven setup status=%d", res.Code)
		}
		if store.Get("apiKey") != nil {
			t.Fatal("unproven setup wrote credentials")
		}
	}
	status := bootstrapRequest(engine, http.MethodGet, "/api/auth/status", nil, "")
	if status.Code != http.StatusOK || !bytes.Contains(status.Body.Bytes(), []byte("\"setupTokenRequired\":true")) || bytes.Contains(status.Body.Bytes(), []byte(operatorSetupProof)) {
		t.Fatal("bootstrap status unavailable or disclosed the secret")
	}
	setup := bootstrapRequest(engine, http.MethodPost, "/api/auth/setup", map[string]string{"password": "owner-password", "setupToken": operatorSetupProof}, "")
	if setup.Code != http.StatusOK {
		t.Fatalf("authorized setup status=%d", setup.Code)
	}
	var result struct{ Data string }
	if err := json.Unmarshal(setup.Body.Bytes(), &result); err != nil || result.Data == "" {
		t.Fatal("setup did not return an API key")
	}
	key := result.Data
	if hits.Load() != 0 {
		t.Fatal("an unauthenticated request reached the LAN service")
	}
	unauthorized := bootstrapRequest(engine, http.MethodGet, "/api/url/title?url="+target.URL, nil, "")
	if unauthorized.Code != http.StatusUnauthorized || hits.Load() != 0 {
		t.Fatal("post-setup fetch bypassed authentication")
	}
	authorized := bootstrapRequest(engine, http.MethodGet, "/api/url/title?url="+target.URL, nil, key)
	if authorized.Code != http.StatusOK || !bytes.Contains(authorized.Body.Bytes(), []byte("local media server")) || hits.Load() != 1 {
		t.Fatalf("authenticated LAN title failed, status=%d hits=%d", authorized.Code, hits.Load())
	}
	signin := bootstrapRequest(engine, http.MethodPost, "/api/auth/signin", map[string]string{"password": "owner-password"}, "")
	if signin.Code != http.StatusOK {
		t.Fatalf("existing password login status=%d", signin.Code)
	}
	var login struct{ Data string }
	if err := json.Unmarshal(signin.Body.Bytes(), &login); err != nil || login.Data != key {
		t.Fatal("login changed the key")
	}
	repeated := bootstrapRequest(engine, http.MethodPost, "/api/auth/setup", map[string]string{"password": "replacement-password", "setupToken": operatorSetupProof}, "")
	if repeated.Code != http.StatusBadRequest || store.Get("apiKey") != key {
		t.Fatal("setup replaced established credentials")
	}
}

func TestConcurrentBootstrapStoresExactlyOneOwner(t *testing.T) {
	server, store := newBootstrapServer(t)
	type answer struct {
		status        int
		password, key string
	}
	results := make(chan answer, 8)
	start := make(chan struct{})
	var workers sync.WaitGroup
	for i := range 8 {
		workers.Add(1)
		go func(index int) {
			defer workers.Done()
			<-start
			password := "owner-password-" + strconv.Itoa(index)
			res := bootstrapRequest(server.Engine(), http.MethodPost, "/api/auth/setup", map[string]string{"password": password, "setupToken": operatorSetupProof}, "")
			var body struct{ Data string }
			_ = json.Unmarshal(res.Body.Bytes(), &body)
			results <- answer{res.Code, password, body.Data}
		}(i)
	}
	close(start)
	workers.Wait()
	close(results)
	successes := 0
	for result := range results {
		if result.status == http.StatusOK {
			successes++
			if result.key == "" || store.Get("apiKey") != result.key {
				t.Fatal("persisted key differs from the initialized owner")
			}
			hash, _ := store.Get("passwordHash").(string)
			if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(result.password)); err != nil {
				t.Fatal("persisted password differs from the initialized owner")
			}
		} else if result.status != http.StatusBadRequest && result.status != http.StatusTooManyRequests {
			t.Fatalf("unexpected concurrent setup status=%d", result.status)
		}
	}
	if successes != 1 {
		t.Fatalf("initialized owners=%d, want1", successes)
	}
}

func TestAuthEnabledWithoutBootstrapSecretFailsClosed(t *testing.T) {
	config := &downloadIdentityConfigStore{values: map[string]any{}}
	server := New(core.NewTaskQueue(nil, 1), nil, nil, config, Options{EnableAuth: true})
	defer server.Close()
	res := bootstrapRequest(server.Engine(), http.MethodPost, "/api/auth/setup", map[string]string{"password": "owner-password"}, "")
	if res.Code != http.StatusServiceUnavailable || config.Get("apiKey") != nil {
		t.Fatal("missing bootstrap secret permitted setup")
	}
}
