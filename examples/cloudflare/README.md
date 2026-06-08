# Cloudflare WAF And Rate Limit Rule Examples

These examples are defensive templates for Cloudflare WAF custom rules and rate
limiting rules. Validate field availability and exact action names against your
Cloudflare plan and account features before production use.

## WAF Custom Rules

| Goal | Expression | Action |
|---|---|---|
| Challenge suspicious login traffic | `(http.request.uri.path eq "/auth/login" and http.request.method eq "POST" and cf.threat_score gt 10)` | Managed Challenge |
| Protect admin routes | `(http.request.uri.path starts_with "/admin" and not ip.src in {203.0.113.10 203.0.113.11})` | Block |
| Challenge unusual API clients | `(http.request.uri.path starts_with "/api/" and not cf.client.bot and http.user_agent eq "")` | Managed Challenge |
| Block unexpected methods | `(http.request.method in {"TRACE" "CONNECT"})` | Block |
| Add pressure relief for non-critical export route | `(http.request.uri.path starts_with "/reports/export")` | Managed Challenge or stricter rate limit |

## Rate Limit Rule Templates

| Route | Characteristics | Threshold | Mitigation |
|---|---|---|---|
| `/auth/login` | IP, path, method | 10 requests / 60 seconds | Managed Challenge for 10 minutes |
| `/password/reset` | IP, path, method | 5 requests / 60 seconds | Managed Challenge |
| `/api/*` | API token or IP, path | 300 requests / 60 seconds | Block or challenge depending on user class |
| `/reports/export` | user id or API key, path | 3 requests / 60 seconds | 429 / challenge |

## Operational Notes

- Start new rules in log or simulate mode when possible.
- Use managed challenge before broad blocking when real-user impact is unclear.
- Keep emergency rules time-bound and document why they were added.
- Pair WAF rules with origin isolation so attackers cannot bypass the edge.

