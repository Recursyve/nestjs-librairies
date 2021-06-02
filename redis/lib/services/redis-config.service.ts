import { Injectable } from "@nestjs/common";
import * as Redis from "ioredis";
import { RedisOptions } from "ioredis";

@Injectable()
export class RedisConfigService {
    public connectionString: string;
    public host: string;
    public port: number;
    public password: string;
    public database: number;
    public lpushBlockSize: number;

    constructor() {
        this.connectionString = process.env.REDIS_CONNECTION_STRING;
        this.host = process.env.REDIS_HOST ?? "127.0.0.1";
        this.password = process.env.REDIS_PASSWORD;
        this.port = +process.env.REDIS_PORT ?? 6379;
        this.database = +process.env.REDIS_DATABASE ?? 0;
        this.lpushBlockSize = process.env.REDIS_LPUSH_BLOCK_SIZE ? +process.env.REDIS_LPUSH_BLOCK_SIZE : 250;
    }

    public getConfig(): RedisOptions {
        const option: RedisOptions = {
            host: this.host,
            port: this.port,
            db: this.database
        };

        if (this.password) {
            option.password = this.password;
        }

        return option;
    }

    public getRedisInstance(): Redis.Redis {
        const options = this.getConfig();
        if (this.connectionString) {
            return new Redis(this.connectionString, options);
        }
        return new Redis(options);
    }
}
