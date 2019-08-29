import { Injectable } from "@nestjs/common";
import { RedisOptions } from "ioredis";

@Injectable()
export class RedisConfigService {
    public host: string;
    public port: number;
    public password: string;
    public database: number;

    constructor() {
        this.host = process.env.REDIS_HOST || "127.0.0.1";
        this.password = process.env.REDIS_PASSWORD;
        this.port = +process.env.REDIS_PORT || 6379;
        this.database = +process.env.REDIS_DATABASE || 0;
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
}
