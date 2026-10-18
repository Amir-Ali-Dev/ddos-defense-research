# Cloudflare templates — conceptual and not deployed

The [JSON example](rate-limit-rules.template.json) uses the Rulesets API zone ruleset
shape: kind=zone, phase=http_ratelimit, action=block and a nested ratelimit object with
period, requests_per_period, mitigation_timeout and characteristics. It has no account,
zone/ruleset id, token or apply script. It is not a directly executable deployment.
It is not schema/API-account tested. Review existing phase entrypoints to avoid replacing
rules; use the documented create/update endpoint for your actual zone/ruleset.

The example uses 5 POST login requests / 10 seconds by IP and data-center id,
with a 10-second block. These settings are illustrative, not equivalent to the local
Redis counter. Cloudflare counters are distributed; do not promise an exact global cap.
The previous period_seconds/mitigation object and block_or_challenge action were not
valid Rulesets API fields/actions and have been removed.

Allowed periods, characteristics, counting expressions, rule counts and actions vary
by plan/product entitlement. Header/API key/custom user characteristics and response-based
counting may require Advanced Rate Limiting; no unvalidated header establishes identity.
This example deliberately uses source IP, not an arbitrary API key. Check the current
parameter/availability tables in your account; no paid tier is required for the local lab.

[WAF expressions](waf-custom-rules.md) are also unapplied. Avoid browser challenges on
machine APIs without a compatible client flow. Log/simulate only where the plan supports
it; otherwise test a narrow rule and monitor false positives before broad enforcement.

Official sources reviewed 2026-10-19:

- [Create zone rate-limit rules via API](https://developers.cloudflare.com/waf/rate-limiting-rules/create-api/).
- [Rate-limit parameters and availability](https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/).
- [Distributed rate counting](https://developers.cloudflare.com/waf/rate-limiting-rules/request-rate/).
- [Rules language functions](https://developers.cloudflare.com/ruleset-engine/rules-language/functions/).
- [Threat score reference](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.threat_score/).
