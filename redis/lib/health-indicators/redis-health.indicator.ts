import { Injectable } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";

import { RedisService } from "../services/redis.service";

@Injectable()
export class RedisHealthIndicator {
    constructor(
        private readonly healthIndicatorService: HealthIndicatorService,
        private readonly redisService: RedisService
    ) {}

    public pingCheck(key: string) {
        return this.healthIndicatorService
            .check(key)
            .attempt(async () => {
                const [error, response] = await this.redisService.ping();
                if (error) {
                    throw error;
                }

                return { operation: "PING", response };
            })
            .withTimeout(1000);
    }
}
