import { Injectable } from "@nestjs/common";
import * as Redis from "ioredis";
import { RedisConfigService } from "./redis-config.service";

@Injectable()
export class RedisService {
    private readonly client: Redis.Redis;

    constructor(private readonly configService: RedisConfigService) {
        this.client = new Redis(configService.getConfig());
    }

    public async disconnect(): Promise<void> {
        this.client.disconnect();
    }

    public async exist(key: string): Promise<boolean> {
        return (await this.client.exists(key)) > 0;
    }

    public set(key: string, value: string): Promise<any> {
        return this.client.set(key, value);
    }

    public get(key: string): Promise<string> {
        return this.client.get(key);
    }

    public async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    public lpush(key: string, ...value: string[]): Promise<number> {
        if (!value.length) {
            return;
        }

        return this.client.lpush(key, ...value);
    }

    public lrem(key: string, value: string, count: number = 0): Promise<number> {
        return this.client.lrem(key, count, value);
    }

    public lrange(key: string, start: number, end: number): Promise<string[]> {
        return this.client.lrange(key, start, end);
    }

    public async scanDel(pattern: string): Promise<void> {
        const keys = await this.scan(pattern);
        if (keys && keys.length) {
            await this.client.del(...keys);
        }
    }

    public zadd(key: string, value: string, score: number): Promise<string | number> {
        return this.client.zadd(key, score.toString(), value);
    }

    public async zrevrange(key: string, start: number, end: number): Promise<string[]> {
        return await this.client.zrevrange(key, start, end);
    }

    public async zscore(key: string, value: string): Promise<number> {
        return +(await this.client.zscore(key, value));
    }

    public scan(pattern: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            const stream = this.client.scanStream({
                match: pattern
            });

            const keys = [];
            stream.on("data", resultKeys => {
                for (const key of resultKeys) {
                    keys.push(key);
                }
            });
            stream.on("end", async () => {
                resolve(keys);
            });
        });
    }
}
