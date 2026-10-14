import { Injectable } from "@nestjs/common";
import { isNotEmpty } from "@recursyve/nice-ts-utils";
import Redis from "ioredis";
import type { ScanStreamOptions } from "ioredis/built/types";

import { getSlices } from "../utils/array.utils";
import { RedisConfigService } from "./redis-config.service";

export interface RedidSetOptions {
    // ex: seconds, px: milliseconds
    unit: "EX" | "PX";
    duration: number;
}

export type RedisScanOptions = Omit<ScanStreamOptions, "match">;
export type RedisValue = Buffer | number | string;

@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor(private readonly configService: RedisConfigService) {
        this.client = configService.getRedisInstance();
    }

    public disconnect(): void {
        this.client.disconnect();
    }

    public async keys(keys: string): Promise<string[]> {
        return this.client.keys(keys);
    }

    public async exist(key: string): Promise<boolean> {
        return (await this.client.exists(key)) > 0;
    }

    public async set(key: string, value: RedisValue, options?: RedidSetOptions): Promise<"OK" | null> {
        if (!options) {
            return this.client.set(key, value);
        }

        switch (options.unit) {
            case "EX":
                return this.client.set(key, value, "EX", options.duration);
            case "PX":
                return this.client.set(key, value, "PX", options.duration);
        }
    }

    public async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    public async mget(...keys: string[]): Promise<(string | null)[]> {
        return this.client.mget(...keys);
    }

    public async getBuffer(key: string): Promise<Buffer | null> {
        return this.client.getBuffer(key);
    }

    public async del(...keys: string[]): Promise<void> {
        await this.client.del(...keys);
    }

    public async lpush(key: string, ...value: RedisValue[]): Promise<number> {
        if (!value.length) {
            return 0;
        }

        const slices = getSlices(value, this.configService.lpushBlockSize);
        let lastTotalLengthForKey = 0;
        for (const slice of slices) {
            if (!slice.length) {
                continue;
            }

            lastTotalLengthForKey = await this.client.lpush(key, ...slice);
        }

        return lastTotalLengthForKey;
    }

    public async lrem(key: string, value: RedisValue, count = 0): Promise<number> {
        return this.client.lrem(key, count, value);
    }

    public async lrange(key: string, start: number, end: number): Promise<string[]> {
        return this.client.lrange(key, start, end);
    }

    public async lrangeBuffer(key: string, start: number, end: number): Promise<Buffer[]> {
        return this.client.lrangeBuffer(key, start, end);
    }

    public async scanDel(pattern: string, options?: RedisScanOptions): Promise<void> {
        const keys = await this.scan(pattern, options);
        if (keys.length) {
            await this.client.del(...keys);
        }
    }

    public async sadd(key: string, ...value: RedisValue[]): Promise<number> {
        return this.client.sadd(key, value);
    }

    public async srem(key: string, ...value: RedisValue[]): Promise<number> {
        return this.client.srem(key, value);
    }

    public async smembers(key: string): Promise<string[]> {
        return this.client.smembers(key);
    }

    public async smembersBuffer(key: string): Promise<Buffer[]> {
        return this.client.smembersBuffer(key);
    }

    public async sismember(key: string, value: RedisValue): Promise<number> {
        return this.client.sismember(key, value);
    }

    public async smove(source: string, destination: string, value: RedisValue): Promise<number> {
        return this.client.smove(source, destination, value);
    }

    public async zadd(key: string, value: RedisValue, score: number): Promise<number | string> {
        return this.client.zadd(key, score.toString(), value);
    }

    public async zrevrange(key: string, start: number, end: number): Promise<string[]> {
        return this.client.zrevrange(key, start, end);
    }

    public async zscore(key: string, value: RedisValue): Promise<number | null> {
        const result = await this.client.zscore(key, value);
        if (isNotEmpty(result)) {
            return +result;
        }

        return null;
    }

    public async ping(): Promise<string> {
        return this.client.ping();
    }

    public async scan(pattern: string, options: RedisScanOptions = { count: 1000 }): Promise<string[]> {
        const stream = this.client.scanStream({
            match: pattern,
            count: options.count ?? 1000,
            type: options.type
        });

        const keys: string[] = [];

        for await (const batch of stream as AsyncIterable<string[]>) {
            keys.push(...batch);
        }

        return keys;
    }
}
