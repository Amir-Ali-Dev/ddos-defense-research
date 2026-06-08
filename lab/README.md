# Defensive DDoS Lab

This lab is for studying defensive configuration locally. It does not include
traffic generation tools and should not be used against any public system.

Files:

- [docker-compose.yml](docker-compose.yml): Nginx edge container plus a simple
  local demo service.
- [nginx.conf](nginx.conf): local defensive limits and logging.

Suggested study flow:

1. Review the Nginx zones and route-specific limits.
2. Observe how normal browser requests are proxied.
3. Tune limits for different route sensitivity.
4. Compare edge-side limiting with application-side limiting in
   [examples/nestjs](../examples/nestjs/README.md).

