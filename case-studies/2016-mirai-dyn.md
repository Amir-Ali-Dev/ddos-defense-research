# Mirai And Dyn 2016

## Why It Matters

Mirai demonstrated the impact of large numbers of poorly secured IoT devices.
The Dyn incident also showed how DNS provider disruption can indirectly affect
many unrelated websites and applications.

## Defensive Lessons

- DNS is part of the availability architecture.
- Provider concentration creates correlated outage risk.
- IoT security failures can become internet-scale availability problems.
- A site can be healthy while users still cannot resolve or reach it.

## Architecture Takeaway

Use resilient DNS, understand provider dependencies, and avoid treating DNS as
a background detail. For high-value systems, consider multiple DNS providers or
well-tested failover patterns.

