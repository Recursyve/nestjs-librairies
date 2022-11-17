import { Inject, Injectable, Optional } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { ACCESS_CONTROL_DEFAULT_DATABASE } from "../constant";
import { AccessActionType, Users } from "../models";
import { RedisKeyUtils } from "../utils";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";
import { ResourceAccessControlService } from "./resource-access-control.service";

@Injectable()
export class AccessControlService {
    constructor(
        @Optional() @Inject(ACCESS_CONTROL_DEFAULT_DATABASE) private type: string,
        private readonly redisService: RedisService,
        private readonly commandBus: CommandBus,
        private readonly databaseAdaptersRegistry: DatabaseAdaptersRegistry
    ) {}

    public forModel(model: any, type?: string): ResourceAccessControlService {
        const service = new ResourceAccessControlService({ model, type: type ?? this.type });
        service.redisService = this.redisService;
        service.commandBus = this.commandBus;
        service.databaseAdaptersRegistry = this.databaseAdaptersRegistry;
        return service;
    }

    public async clearCacheForUser(user: Users) {
        await Promise.all([
            this.redisService.scanDel(RedisKeyUtils.userAccessControl(user, "*")),
            this.redisService.scanDel(RedisKeyUtils.userResourceActionKey(user, "*", "*" as AccessActionType)),
            this.redisService.scanDel(RedisKeyUtils.userResourceActionPattern(user, "*")),
            this.redisService.scanDel(RedisKeyUtils.userResourceIdKey("*", "*" as any, user))
        ]);
    }
}
