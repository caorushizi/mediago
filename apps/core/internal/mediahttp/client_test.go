package mediahttp

import (
	"bufio"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"net/textproto"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestAddressPolicyPreservesLANAndRejectsSpecialTargets(t *testing.T) {
	for _, value := range []string{"192.168.1.5", "10.0.0.2", "172.16.0.5", "fd12::1", "127.0.0.1", "::1", "8.8.8.8", "::ffff:192.168.1.5"} {
		if _, err := addressScope(netip.MustParseAddr(value)); err != nil {
			t.Fatalf("legitimate target %s: %v", value, err)
		}
	}
	for _, value := range []string{"169.254.169.254", "100.100.100.200", "fd00:ec2::254", "0.0.0.0", "::", "224.0.0.1", "ff02::1", "fe80::1", "255.255.255.255", "::ffff:169.254.169.254"} {
		if _, err := addressScope(netip.MustParseAddr(value)); !errors.Is(err, ErrTarget) {
			t.Fatalf("special target accepted %s", value)
		}
	}
}

func testFetcher(t *testing.T, handler http.Handler, records map[string][]netip.Addr) *fetcher {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
		// The only real server is this controlled local fixture. Verify the transport
		// is given an already-resolved IP, rather than the untrusted hostname.
		host, _, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		if _, err := netip.ParseAddr(host); err != nil {
			t.Errorf("dial did not pin IP: %s", address)
		}
		return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
	}
	return &fetcher{transport: transport, lookup: func(_ context.Context, host string) ([]netip.Addr, error) {
		ips, ok := records[host]
		if !ok {
			return nil, errors.New("unknown fixture host")
		}
		return ips, nil
	}}
}

func TestExplicitLANAndLoopbackMediaAndRelativeRedirect(t *testing.T) {
	for _, ip := range []string{"192.168.1.4", "fd12::5", "127.0.0.1", "::1", "8.8.8.8"} {
		t.Run(ip, func(t *testing.T) {
			f := testFetcher(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Host != "media.test" || r.Header.Get("X-Media-Test") != "kept" {
					t.Errorf("host/headers lost: %s", r.Host)
				}
				if r.URL.Path == "/start" {
					http.Redirect(w, r, "/hls/master.m3u8", 302)
					return
				}
				io.WriteString(w, "#EXTM3U\n")
			}), map[string][]netip.Addr{"media.test": {netip.MustParseAddr(ip)}})
			response, err := f.get(context.Background(), "http://media.test/start", http.Header{"X-Media-Test": {"kept"}})
			if err != nil {
				t.Fatal(err)
			}
			defer response.Body.Close()
			content, err := io.ReadAll(response.Body)
			if err != nil || string(content) != "#EXTM3U\n" || response.Request.URL.String() != "http://media.test/hls/master.m3u8" {
				t.Fatalf("response=%s,%s,%v", response.Request.URL, content, err)
			}
		})
	}
}

func TestPublicRedirectCannotEnterLANOrMetadata(t *testing.T) {
	for _, ip := range []string{"192.168.1.4", "fd12::5", "127.0.0.1", "169.254.169.254", "100.100.100.200"} {
		t.Run(ip, func(t *testing.T) {
			f := testFetcher(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Host == "other.test" {
					t.Error("blocked target was contacted")
				}
				http.Redirect(w, r, "http://other.test/secret", 302)
			}), map[string][]netip.Addr{"public.test": {netip.MustParseAddr("8.8.8.8")}, "other.test": {netip.MustParseAddr(ip)}})
			if _, err := f.get(context.Background(), "http://public.test/start", nil); !errors.Is(err, ErrTarget) {
				t.Fatalf("redirect target accepted: %v", err)
			}
		})
	}
}

func TestDNSIsPinnedAcrossRedirectsAndCredentialsStayOnOrigin(t *testing.T) {
	records := map[string][]netip.Addr{"media.test": {netip.MustParseAddr("8.8.8.8")}, "cdn.test": {netip.MustParseAddr("8.8.4.4")}}
	f := testFetcher(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/start" {
			http.Redirect(w, r, "/same", 302)
			return
		}
		if r.URL.Path == "/same" {
			if r.Header.Get("Authorization") != "Bearer fixture" {
				t.Error("same-origin header lost")
			}
			http.Redirect(w, r, "http://cdn.test/final", 302)
			return
		}
		if r.Header.Get("Authorization") != "" || r.Header.Get("Cookie") != "" {
			t.Error("credentials leaked across origins")
		}
		io.WriteString(w, "ok")
	}), records)
	lookup := f.lookup
	calls := map[string]int{}
	f.lookup = func(ctx context.Context, host string) ([]netip.Addr, error) {
		calls[host]++
		if calls[host] > 1 {
			return []netip.Addr{netip.MustParseAddr("127.0.0.1")}, nil
		}
		return lookup(ctx, host)
	}
	response, err := f.get(context.Background(), "http://media.test/start", http.Header{"Authorization": {"Bearer fixture"}, "Cookie": {"session=fixture"}})
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if calls["media.test"] != 1 {
		t.Fatalf("hostname resolved again: %+v", calls)
	}
}

func TestRejectsUnsafeURLsMixedDNSAndRedirectLoops(t *testing.T) {
	f := testFetcher(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { http.Redirect(w, r, "/again", 302) }), map[string][]netip.Addr{"media.test": {netip.MustParseAddr("8.8.8.8")}, "mixed.test": {netip.MustParseAddr("8.8.8.8"), netip.MustParseAddr("127.0.0.1")}})
	for _, raw := range []string{"file:///etc/hosts", "ftp://media.test/file", "http://media.test:0/file", "http://media.test:65536/file", "http://metadata.google.internal/file", "http://media.test/again"} {
		if response, err := f.get(context.Background(), raw, nil); err == nil {
			response.Body.Close()
			t.Fatalf("accepted unsafe target %s", raw)
		}
	}
}

func TestRealLocalMediaAndHTTPProxy(t *testing.T) {
	media := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { io.WriteString(w, "local media") }))
	defer media.Close()
	response, err := Get(context.Background(), media.URL, nil, nil, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || string(body) != "local media" {
		t.Fatalf("local media failed: %s,%v", body, err)
	}
	proxy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host != "192.168.1.5:80" || !strings.HasPrefix(r.RequestURI, "http://192.168.1.5:") {
			t.Errorf("proxy target/host not pinned: %s %s", r.Host, r.RequestURI)
		}
		io.WriteString(w, "proxied media")
	}))
	defer proxy.Close()
	proxyURL, _ := url.Parse(proxy.URL)
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = http.ProxyURL(proxyURL)
	f := fetcher{lookup: func(context.Context, string) ([]netip.Addr, error) {
		return []netip.Addr{netip.MustParseAddr("192.168.1.5")}, nil
	}, transport: transport}
	response, err = f.get(context.Background(), "http://media.test/live.m3u8", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err = io.ReadAll(response.Body)
	if err != nil || string(body) != "proxied media" {
		t.Fatalf("proxy failed: %s,%v", body, err)
	}
}

func TestHTTPSPreservesHostAndVerifiesTLS(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host != "example.com" || r.TLS.ServerName != "example.com" {
			t.Errorf("virtual host or SNI lost: %s %s", r.Host, r.TLS.ServerName)
		}
		io.WriteString(w, "secure media")
	}))
	defer server.Close()
	roots := x509.NewCertPool()
	roots.AddCert(server.Certificate())
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	transport.TLSClientConfig = &tls.Config{RootCAs: roots}
	transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
	}
	f := fetcher{lookup: func(context.Context, string) ([]netip.Addr, error) {
		return []netip.Addr{netip.MustParseAddr("192.168.1.5")}, nil
	}, transport: transport}
	response, err := f.get(context.Background(), "https://example.com/live", nil)
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.Request.URL.Host != "example.com" {
		t.Fatal("response lost original host")
	}
	if response, err := f.get(context.Background(), "https://wrong.test/live", nil); err == nil {
		response.Body.Close()
		t.Fatal("invalid TLS identity accepted")
	}
}

func TestHTTPProxyKeepsPinnedTargetHostAndSeparateCredentials(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	checked := make(chan error, 1)
	go func() {
		connection, err := listener.Accept()
		if err != nil {
			checked <- err
			return
		}
		defer connection.Close()
		connection.SetDeadline(time.Now().Add(3 * time.Second))
		reader := bufio.NewReader(connection)
		line, err := reader.ReadString('\n')
		if err != nil {
			checked <- err
			return
		}
		headers, err := textproto.NewReader(reader).ReadMIMEHeader()
		if err != nil {
			checked <- err
			return
		}
		if line != "GET http://192.168.1.5:80/live.m3u8 HTTP/1.1\r\n" || headers.Get("Host") != "nas.test" || headers.Get("Authorization") != "Bearer media-fixture" || headers.Get("Proxy-Authorization") != "Basic cHJveHktdXNlcjpwcm94eS1wYXNz" {
			checked <- fmt.Errorf("proxy routing or credential separation failed")
			return
		}
		io.WriteString(connection, "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok")
		checked <- nil
	}()
	proxy, _ := url.Parse("http://proxy-user:proxy-pass@" + listener.Addr().String())
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = http.ProxyURL(proxy)
	f := fetcher{lookup: func(context.Context, string) ([]netip.Addr, error) {
		return []netip.Addr{netip.MustParseAddr("192.168.1.5")}, nil
	}, transport: transport}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	response, err := f.get(ctx, "http://nas.test/live.m3u8", http.Header{"Authorization": {"Bearer media-fixture"}})
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if err := <-checked; err != nil {
		t.Fatal(err)
	}
}

func TestGetKeepsBodyAliveAndHonorsCancellation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.(http.Flusher).Flush()
		if r.URL.Path == "/cancel" {
			<-r.Context().Done()
			return
		}
		time.Sleep(10 * time.Millisecond)
		io.WriteString(w, "body")
	}))
	defer server.Close()
	response, err := Get(context.Background(), server.URL+"/body", nil, nil, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || string(body) != "body" {
		t.Fatalf("body cancelled before read: %q,%v", body, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	response, err = Get(ctx, server.URL+"/cancel", nil, nil, time.Second)
	if err != nil {
		cancel()
		t.Fatal(err)
	}
	cancel()
	_, err = io.ReadAll(response.Body)
	response.Body.Close()
	if err == nil {
		t.Fatal("cancelled response kept reading")
	}
}

func TestDualStackNASIsAllowedButPublicRedirectToMixedDNSIsBlocked(t *testing.T) {
	f := testFetcher(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host == "public.test" {
			http.Redirect(w, r, "http://nas.test/live", 302)
			return
		}
		io.WriteString(w, "nas media")
	}), map[string][]netip.Addr{"nas.test": {netip.MustParseAddr("192.168.1.5"), netip.MustParseAddr("2001:4860:4860::8888")}, "public.test": {netip.MustParseAddr("8.8.8.8")}})
	response, err := f.get(context.Background(), "http://nas.test/live", nil)
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response, err := f.get(context.Background(), "http://public.test/start", nil); !errors.Is(err, ErrTarget) {
		if response != nil {
			response.Body.Close()
		}
		t.Fatalf("public redirect expanded to mixed DNS: %v", err)
	}
}

func TestSOCKSProxyReceivesPinnedIPAndOriginalMediaHost(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	checked := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			checked <- err
			return
		}
		defer conn.Close()
		conn.SetDeadline(time.Now().Add(3 * time.Second))
		greeting := make([]byte, 2)
		if _, err := io.ReadFull(conn, greeting); err != nil {
			checked <- err
			return
		}
		methods := make([]byte, int(greeting[1]))
		if _, err := io.ReadFull(conn, methods); err != nil {
			checked <- err
			return
		}
		conn.Write([]byte{5, 0})
		header := make([]byte, 4)
		if _, err := io.ReadFull(conn, header); err != nil {
			checked <- err
			return
		}
		if header[0] != 5 || header[1] != 1 || header[3] != 1 {
			checked <- fmt.Errorf("SOCKS must connect to vetted IPv4, not re-resolve hostname")
			return
		}
		destination := make([]byte, 6)
		if _, err := io.ReadFull(conn, destination); err != nil {
			checked <- err
			return
		}
		if net.IP(destination[:4]).String() != "192.168.1.5" || binary.BigEndian.Uint16(destination[4:]) != 80 {
			checked <- fmt.Errorf("incorrect SOCKS destination")
			return
		}
		conn.Write([]byte{5, 0, 0, 1, 127, 0, 0, 1, 0, 80})
		request, err := http.ReadRequest(bufio.NewReader(conn))
		if err != nil {
			checked <- err
			return
		}
		if request.Host != "nas.test" || request.URL.Path != "/live" {
			checked <- fmt.Errorf("SOCKS lost original host/path")
			return
		}
		io.WriteString(conn, "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok")
		checked <- nil
	}()
	proxy, _ := url.Parse("socks5://" + listener.Addr().String())
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = http.ProxyURL(proxy)
	f := fetcher{lookup: func(context.Context, string) ([]netip.Addr, error) {
		return []netip.Addr{netip.MustParseAddr("192.168.1.5")}, nil
	}, transport: transport}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	response, err := f.get(ctx, "http://nas.test/live", nil)
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if err := <-checked; err != nil {
		t.Fatal(err)
	}
}
