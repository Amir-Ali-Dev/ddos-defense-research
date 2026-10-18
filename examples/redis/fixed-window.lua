-- Atomic first-request-anchored fixed window, not a sliding window.
-- KEYS[1]: server-created identity/route key; ARGV: window_ms, limit.
-- Returns {allowed, count, remaining_ttl_ms}; rejected requests do not extend TTL.
local window_ms = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
if not window_ms or not limit or window_ms < 1 or limit < 1
   or window_ms > 60000 or limit > 1000
   or window_ms ~= math.floor(window_ms) or limit ~= math.floor(limit) then
  return redis.error_reply('invalid limiter arguments')
end
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
-- Repair an accidentally persistent counter, also atomically.
if count == 1 or ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], window_ms)
  ttl = window_ms
end
return {count <= limit and 1 or 0, count, ttl}
