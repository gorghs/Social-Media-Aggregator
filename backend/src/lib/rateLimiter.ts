// Basic token-bucket-ish limiter per service key stored in Redis
import redis from "./redisClient";

export async function allowRequest(key: string, limit = 500, windowSec = 60) {
  const k = `rate:${key}`;
  const now = Date.now();
  const tx = redis.multi();
  tx.zremrangebyscore(k, 0, now - windowSec * 1000);
  tx.zadd(k, now.toString(), now.toString());
  tx.zcard(k);
  tx.expire(k, windowSec + 5);
  const [, , count] = await tx.exec();
  return (count as number) <= limit;
}
