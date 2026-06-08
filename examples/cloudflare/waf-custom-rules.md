# Cloudflare WAF Custom Rule Examples

These expressions are templates for defensive edge filtering. Validate fields,
actions, phases, and plan availability in the current Cloudflare dashboard or
Rulesets API before production use.

## Login Protection

```text
(http.request.uri.path eq "/auth/login" and http.request.method eq "POST" and cf.threat_score gt 10)
```

Suggested action: `Managed Challenge`

Why: Login is expensive because it often touches identity services, password
hashing, risk scoring, and database lookups.

## Admin Route Isolation

```text
(http.request.uri.path starts_with "/admin" and not ip.src in {203.0.113.10 203.0.113.11})
```

Suggested action: `Block`

Why: Admin routes should have a smaller trusted network surface than public
application routes.

## Empty User-Agent On API Routes

```text
(http.request.uri.path starts_with "/api/" and not cf.client.bot and http.user_agent eq "")
```

Suggested action: `Managed Challenge`

Why: Empty user agents are not always malicious, but they are useful as one
signal in a scoped rule.

## Unexpected HTTP Methods

```text
(http.request.method in {"TRACE" "CONNECT"})
```

Suggested action: `Block`

Why: Most public web applications do not need these methods exposed at the edge.
