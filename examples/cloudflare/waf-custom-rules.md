# Reviewed WAF expression examples (unapplied)

Custom rule body/action and rule allowance depend on your plan. These are matching
expressions, not an exported/applied ruleset. See [plan notes and sources](README.md).

Restrict administration to your actual approved addresses (the listed TEST-NET IPs
are documentation placeholders, not a production allowlist):

~~~text
(starts_with(http.request.uri.path, "/admin/") and not ip.src in {203.0.113.10 203.0.113.11})
~~~

Suggested action: block. Handle /admin itself separately if your application serves it.

Unexpected methods:

~~~text
(http.request.method in {"TRACE" "CONNECT"})
~~~

Suggested action: block only after confirming legitimate protocol requirements.

Login scope for a narrowly staged rule:

~~~text
(http.request.uri.path eq "/auth/login" and http.request.method eq "POST")
~~~

Use the rate-limit example rather than challenging every API call. A challenge is a
browser interaction and can break non-browser clients. Do not block solely for an empty
User-Agent. The old infix starts_with syntax is replaced by the starts_with() function;
the obsolete cf.threat_score condition is removed. Protect the origin from direct bypass.
