package handler

import (
	"net/http"
	"net/http/httputil"
	"net/url"
)

func NewReverseProxy(baseURL string) http.Handler {
	target, err := url.Parse(baseURL)
	if err != nil {
		panic(err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	original := proxy.Director
	proxy.Director = func(r *http.Request) {
		original(r)
		r.Host = target.Host
	}
	return proxy
}
