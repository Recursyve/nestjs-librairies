import type { OnModuleDestroy } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { TerminusModule } from "@nestjs/terminus";
import { isNotEmpty } from "@recursyve/nice-ts-utils";

import { RedisHealthIndicator } from "./health-indicators/redis-health.indicator";
import { RedisConfigService } from "./services/redis-config.service";
import { RedisService } from "./services/redis.service";

@Module({
    imports: [TerminusModule],
    providers: [RedisConfigService, RedisService, RedisHealthIndicator],
    exports: [RedisConfigService, RedisService, RedisHealthIndicator]
})
export class RedisModule implements OnModuleDestroy {
    constructor(private readonly moduleRef: ModuleRef) {}

    public onModuleDestroy(): void {
        /**
         * Disconnection causes some issues when running tests, for now we deactivate it
         */
        if (isNotEmpty(process.env["CI"])) {
            return;
        }

        this.moduleRef.get(RedisService).disconnect();
    }
}
