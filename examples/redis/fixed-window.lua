-- Atomic fixed-window rate limiter.
--
-- KEYS[1] = limiter key, for example "rl:login:203.0.113.10"
-- ARGV[1] = window size in milliseconds
-- ARGV[2] = maximum requests in this window
--
-- Returns: { allowed, current_count, ttl_ms }

local key = KEYS[1]
local window_ms = tonumber(ARGV[1])
local max_requests = tonumber(ARGV[2])

local current = redis.call("INCR", key)

if current == 1 then
  redis.call("PEXPIRE", key, window_ms)
end

local ttl = redis.call("PTTL", key)

if current > max_requests then
  return {0, current, ttl}
end

return {1, current, ttl}

