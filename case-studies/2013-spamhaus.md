# Spamhaus 2013

## Why It Matters

The Spamhaus incident made DNS amplification and open resolver abuse highly
visible to the broader internet operations community.

## Defensive Lessons

- Open and misconfigured infrastructure can become an unintended amplifier.
- Organizations need upstream mitigation, not only local firewall rules.
- Internet-wide hygiene, including source address validation, reduces systemic
  risk.

## Architecture Takeaway

Volumetric attacks often need to be handled before traffic reaches your network
link. CDN, Anycast, scrubbing, and provider escalation are architectural
controls, not optional extras.

