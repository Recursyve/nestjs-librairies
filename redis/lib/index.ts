import { Module, OnModuleDestroy } from "@nestjs/common";
import { RedisConfigService } from "./services/redis-config.service";
import { RedisService } from "./services/redis.service";
import { ModuleRef } from "@nestjs/core";

@Module({
    providers: [RedisConfigService, RedisService],
    exports: [RedisService]
})
export class RedisModule implements OnModuleDestroy {
    constructor(private readonly moduleRef: ModuleRef) {}

    public async onModuleDestroy(): Promise<void> {
        const service = await this.moduleRef.get(RedisService);
        await service.disconnect();
    }
}

export * from "./services/redis.service";
