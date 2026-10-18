# Nginx defensive request limits

[rate-limit.conf](rate-limit.conf) is a complete nginx.conf with events/http sections.
It proxies to 127.0.0.1:3000; adapt the backend for a real deployment. Validate using:

~~~sh
docker run --rm -v "./examples/nginx/rate-limit.conf:/etc/nginx/nginx.conf:ro" nginx:1.30.6-alpine nginx -t
~~~

The runnable [lab config](../../lab/nginx.conf) uses backend:8000 with smaller observable
budgets. Nginx uses a leaky bucket: the lab allows an initial public request plus burst=2;
login allows an initial request plus burst=1. Rejections return 429 and conservative
Retry-After: 1 for these configured 1r/s and 2r/s refill rates. They do not advertise an
exact per-client remaining budget. Connection limits also return 429.

Identity is the socket peer ($binary_remote_addr). Arbitrary Authorization and API keys
are never authentication. Inbound XFF is overwritten before forwarding. The app must
trust only this proxy and prevent direct bypass if it needs the original client IP.
Behind another proxy, configure ngx_http_realip_module only with exact trusted ranges
and a header that proxy overwrites; this lab does not enable it. See [proxy guidance](../../docs/OPERATIONS.md).
Nginx request limits do not provide volumetric DDoS protection.
