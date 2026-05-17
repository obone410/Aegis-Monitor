import { getEnv } from "./env";
import { logger } from "./logger";

export interface CacheClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

class MemoryCacheClient implements CacheClient {
  private cache = new Map<string, { expiresAt: number; value: unknown }>();

  async get<T>(key: string) {
    const entry = this.cache.get(key);

    if (!entry || entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

class UpstashRedisCacheClient implements CacheClient {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async get<T>(key: string) {
    const response = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      logger.warn("redis_cache_get_failed", { status: response.status, key });
      return null;
    }

    const body = (await response.json()) as { result?: string | null };
    return body.result ? (JSON.parse(body.result) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number) {
    const response = await fetch(`${this.url}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        value: JSON.stringify(value),
        ex: ttlSeconds
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      logger.warn("redis_cache_set_failed", { status: response.status, key });
    }
  }
}

let cacheClient: CacheClient | null = null;

export function getCacheClient() {
  if (cacheClient) {
    return cacheClient;
  }

  const env = getEnv();

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    cacheClient = new UpstashRedisCacheClient(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
    return cacheClient;
  }

  cacheClient = new MemoryCacheClient();
  return cacheClient;
}
