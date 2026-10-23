// Package mediahttp fetches media metadata without expanding the caller's network scope.
package mediahttp

import (
	"bufio"
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strconv"
	"strings"
	"time"
)

var ErrTarget = errors.New("media request target is not permitted")

type destination struct {
	ips   []netip.Addr
	scope int
}
type fetcher struct {
	lookup    func(context.Context, string) ([]netip.Addr, error)
	transport *http.Transport
}

// Get retains explicitly requested LAN and loopback media access. Public URLs
// cannot redirect into those networks. Every connection uses a vetted IP rather
// than resolving the hostname again, including requests through a configured proxy.
func Get(ctx context.Context, rawURL string, headers http.Header, transport *http.Transport, timeout time.Duration) (*http.Response, error) {
	if transport == nil {
		transport = http.DefaultTransport.(*http.Transport)
	}
	f := fetcher{lookup: func(ctx context.Context, host string) ([]netip.Addr, error) {
		return net.DefaultResolver.LookupNetIP(ctx, "ip", host)
	}, transport: transport}
	ctx, cancel := context.WithTimeout(ctx, timeout)
	response, err := f.get(ctx, rawURL, headers)
	if err != nil {
		cancel()
		return nil, err
	}
	response.Body = &closingBody{ReadCloser: response.Body, close: cancel}
	return response, nil
}

type closingBody struct {
	io.ReadCloser
	close func()
}

func (b *closingBody) Close() error { err := b.ReadCloser.Close(); b.close(); return err }

func addressScope(ip netip.Addr) (int, error) {
	ip = ip.Unmap()
	if !ip.IsValid() || ip.Zone() != "" || ip.IsUnspecified() || ip.IsMulticast() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip == netip.MustParseAddr("255.255.255.255") || ip == netip.MustParseAddr("100.100.100.200") || ip == netip.MustParseAddr("fd00:ec2::254") {
		return 0, ErrTarget
	}
	if ip.IsLoopback() {
		return 2, nil
	}
	if ip.IsPrivate() {
		return 1, nil
	}
	if !ip.IsGlobalUnicast() {
		return 0, ErrTarget
	}
	return 0, nil
}

func (f *fetcher) resolve(ctx context.Context, target *url.URL) (destination, error) {
	if (target.Scheme != "http" && target.Scheme != "https") || target.Hostname() == "" || target.Opaque != "" || strings.Contains(target.Hostname(), "%") {
		return destination{}, ErrTarget
	}
	if port := target.Port(); port != "" {
		number, err := strconv.Atoi(port)
		if err != nil || number < 1 || number > 65535 {
			return destination{}, ErrTarget
		}
	}
	host := strings.ToLower(strings.TrimSuffix(target.Hostname(), "."))
	if host == "metadata.google.internal" || host == "metadata.goog" || host == "instance-data" {
		return destination{}, ErrTarget
	}
	ips, err := f.lookup(ctx, host)
	if err != nil {
		return destination{}, err
	}
	if len(ips) == 0 {
		return destination{}, ErrTarget
	}
	result := destination{ips: ips, scope: -1}
	for _, ip := range ips {
		scope, err := addressScope(ip)
		if err != nil {
			return destination{}, err
		}
		// Home NAS hosts can advertise private IPv4 and global IPv6 together.
		// Preserve their initial scope, but never let a public redirect acquire it.
		if scope > result.scope {
			result.scope = scope
		}
	}
	return result, nil
}

func (f *fetcher) get(ctx context.Context, rawURL string, headers http.Header) (*http.Response, error) {
	target, err := url.Parse(rawURL)
	if err != nil {
		return nil, ErrTarget
	}
	headers = headers.Clone()
	// Captured browser proxy credentials never belong on a media server request.
	headers.Del("Proxy-Authorization")
	cache := map[string]destination{}
	allowedScope := -1
	for redirects := 0; redirects <= 5; redirects++ {
		key := strings.ToLower(target.Hostname())
		// Validate scheme and port even when the DNS result is already cached.
		if (target.Scheme != "http" && target.Scheme != "https") || target.Hostname() == "" || target.Opaque != "" {
			return nil, ErrTarget
		}
		if port := target.Port(); port != "" {
			number, e := strconv.Atoi(port)
			if e != nil || number < 1 || number > 65535 {
				return nil, ErrTarget
			}
		}
		dest, ok := cache[key]
		if !ok {
			dest, err = f.resolve(ctx, target)
			if err != nil {
				return nil, err
			}
			cache[key] = dest
		}
		if allowedScope == -1 {
			allowedScope = dest.scope
		}
		if dest.scope > allowedScope {
			return nil, ErrTarget
		}
		response, err := f.request(ctx, target, headers, dest)
		if err != nil {
			return nil, err
		}
		if response.StatusCode != 301 && response.StatusCode != 302 && response.StatusCode != 303 && response.StatusCode != 307 && response.StatusCode != 308 {
			return response, nil
		}
		location := response.Header.Get("Location")
		if location == "" {
			return response, nil
		}
		response.Body.Close()
		if redirects == 5 {
			return nil, errors.New("too many media redirects")
		}
		next, err := target.Parse(location)
		if err != nil {
			return nil, ErrTarget
		}
		if !strings.EqualFold(target.Host, next.Host) || target.Scheme != next.Scheme {
			headers.Del("Authorization")
			headers.Del("Cookie")
			headers.Del("Proxy-Authorization")
		}
		target = next
	}
	return nil, ErrTarget
}

func (f *fetcher) request(ctx context.Context, target *url.URL, headers http.Header, dest destination) (*http.Response, error) {
	original, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return nil, err
	}
	var proxy *url.URL
	if f.transport.Proxy != nil {
		proxy, err = f.transport.Proxy(original)
		if err != nil {
			return nil, err
		}
	}
	var lastErr error
	for _, ip := range dest.ips {
		wireURL := *target
		port := target.Port()
		if port == "" {
			if target.Scheme == "https" {
				port = "443"
			} else {
				port = "80"
			}
		}
		wireURL.Host = net.JoinHostPort(ip.Unmap().String(), port)
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, wireURL.String(), nil)
		if err != nil {
			return nil, err
		}
		request.Host = target.Host
		if target.User != nil {
			password, _ := target.User.Password()
			request.SetBasicAuth(target.User.Username(), password)
		}
		for key, values := range headers {
			request.Header[key] = append([]string(nil), values...)
		}
		transport := f.transport.Clone()
		transport.Proxy = http.ProxyURL(proxy)
		if proxy == nil {
			transport.Proxy = nil
		}
		if transport.TLSClientConfig == nil {
			transport.TLSClientConfig = &tls.Config{}
		} else {
			transport.TLSClientConfig = transport.TLSClientConfig.Clone()
		}
		transport.TLSClientConfig.ServerName = target.Hostname()
		client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
		var response *http.Response
		if proxy != nil && target.Scheme == "http" && (proxy.Scheme == "http" || proxy.Scheme == "https") {
			response, err = proxyGet(ctx, request, proxy, transport)
		} else {
			response, err = client.Do(request)
		}
		if err != nil {
			transport.CloseIdleConnections()
			lastErr = err
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			continue
		}
		response.Body = &closingBody{ReadCloser: response.Body, close: transport.CloseIdleConnections}
		// Resolve relative playlist references against the public URL, never the pinned IP.
		response.Request.URL = target
		return response, nil
	}
	return nil, fmt.Errorf("media connection failed: %w", lastErr)
}

// An HTTP proxy needs the pinned IP in the absolute request target and the
// original virtual host in Host. Request.WriteProxy uses Host for both, which
// would let the proxy resolve the untrusted hostname a second time.
func proxyGet(ctx context.Context, request *http.Request, proxy *url.URL, transport *http.Transport) (*http.Response, error) {
	address := proxy.Host
	if proxy.Port() == "" {
		if proxy.Scheme == "https" {
			address = net.JoinHostPort(proxy.Hostname(), "443")
		} else {
			address = net.JoinHostPort(proxy.Hostname(), "80")
		}
	}
	dial := transport.DialContext
	if dial == nil {
		dial = (&net.Dialer{}).DialContext
	}
	conn, err := dial(ctx, "tcp", address)
	if err != nil {
		return nil, err
	}
	socket := conn
	stop := context.AfterFunc(ctx, func() { socket.Close() })
	success := false
	defer func() {
		if !success {
			stop()
			conn.Close()
		}
	}()
	if deadline, ok := ctx.Deadline(); ok {
		conn.SetDeadline(deadline)
	}
	if proxy.Scheme == "https" {
		config := transport.TLSClientConfig.Clone()
		config.ServerName = proxy.Hostname()
		secured := tls.Client(conn, config)
		if err := secured.HandshakeContext(ctx); err != nil {
			return nil, err
		}
		conn = secured
	}
	outgoing := request.Clone(ctx)
	if proxy.User != nil {
		password, _ := proxy.User.Password()
		outgoing.SetBasicAuth(proxy.User.Username(), password)
		outgoing.Header.Set("Proxy-Authorization", outgoing.Header.Get("Authorization"))
		outgoing.Header.Del("Authorization")
		if value := request.Header.Get("Authorization"); value != "" {
			outgoing.Header.Set("Authorization", value)
		}
	}
	var wire bytes.Buffer
	if err := outgoing.Write(&wire); err != nil {
		return nil, err
	}
	_, rest, ok := bytes.Cut(wire.Bytes(), []byte("\r\n"))
	if !ok {
		return nil, errors.New("invalid proxy request")
	}
	target := *request.URL
	target.User = nil
	target.Fragment = ""
	target.RawFragment = ""
	if _, err := fmt.Fprintf(conn, "GET %s HTTP/1.1\r\n", target.String()); err != nil {
		return nil, err
	}
	if _, err := conn.Write(rest); err != nil {
		return nil, err
	}
	response, err := http.ReadResponse(bufio.NewReader(io.LimitReader(conn, 8<<20)), request)
	if err != nil {
		return nil, err
	}
	response.Body = &closingBody{ReadCloser: response.Body, close: func() { stop(); conn.Close() }}
	success = true
	return response, nil
}
