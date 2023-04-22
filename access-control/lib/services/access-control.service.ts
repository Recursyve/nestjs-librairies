import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { Model } from "sequelize-typescript";
import { AccessActionType, Users } from "../models";
import { RedisKeyUtils } from "../utils";
import { AccessControlResourceLoaderService } from "./access-control-resource-loader.service";
import { ResourceAccessControlService } from "./resource-access-control.service";

@Injectable()
export class AccessControlService {
    constructor(
        private readonly redisService: RedisService,
        private readonly commandBus: CommandBus,
        private readonly accessControlResourceLoaderService: AccessControlResourceLoaderService
    ) {}

    public forModel(model: typeof Model): ResourceAccessControlService {
        const service = new ResourceAccessControlService(model.tableName);
        service.redisService = this.redisService;
        service.commandBus = this.commandBus;
        service.accessControlResourceLoaderService = this.accessControlResourceLoaderService;
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
