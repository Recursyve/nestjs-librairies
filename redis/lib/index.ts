import { Module, OnModuleDestroy } from "@nestjs/common";
import { RedisConfigService } from "./services/redis-config.service";
import { RedisService } from "./services/redis.service";
import { ModuleRef } from "@nestjs/core";
import {RedisHealthIndicator} from "./health-indicators/redis-health.indicator";

@Module({
    providers: [RedisConfigService, RedisService, RedisHealthIndicator],
    exports: [RedisConfigService, RedisService, RedisHealthIndicator]
})
export class RedisModule implements OnModuleDestroy {
    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleDestroy(): Promise<void> {
        const service = await this.moduleRef.get(RedisService);

        /**
         * Disconnection causes some issues when running tests, for now we deactivate it
         */
        if (!process.env.CI) {
            await service.disconnect();
        }
    }
}

export * from "./services/redis.service";
export * from "./services/redis-config.service";
