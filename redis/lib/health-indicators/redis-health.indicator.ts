import { Injectable } from "@nestjs/common";
import type { HealthCheckAttempt } from "@nestjs/terminus";
import { HealthIndicatorService } from "@nestjs/terminus";

import { RedisService } from "../services/redis.service";

@Injectable()
export class RedisHealthIndicator {
    constructor(
        private readonly redisService: RedisService,
        private readonly healthIndicatorService: HealthIndicatorService
    ) {}

    public pingCheck<Key extends string>(key: Key): HealthCheckAttempt<Key> {
        return this.healthIndicatorService
            .check(key)
            .attempt(async () => {
                const response = await this.redisService.ping();
                return { operation: "PING", response };
            })
            .withTimeout(3000);
    }
}
