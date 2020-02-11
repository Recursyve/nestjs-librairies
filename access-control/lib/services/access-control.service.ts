import { Injectable } from "@nestjs/common";
import { RedisService } from "@recursyve/nestjs-redis";
import { CommandBus } from "@nestjs/cqrs";
import { Model } from "sequelize-typescript";
import { ResourceAccessControlService } from "./resource-access-control.service";
import { AccessActionType } from "../models";
import { RedisKeyUtils } from "../utils";

@Injectable()
export class AccessControlService {
    constructor(private readonly redisService: RedisService, private readonly commandBus: CommandBus) {}

    public forModel(model: typeof Model): ResourceAccessControlService {
        const service = new ResourceAccessControlService(model.tableName);
        service.redisService = this.redisService;
        service.commandBus = this.commandBus;
        return service;
    }

    public async clearCacheForUser(userId: string) {
        await Promise.all([
            this.redisService.scanDel(RedisKeyUtils.userAccessControl(userId, "*")),
            this.redisService.scanDel(RedisKeyUtils.userResourceActionKey(userId, "*", "*" as AccessActionType)),
            this.redisService.scanDel(RedisKeyUtils.userResourceActionPattern(userId, "*")),
            this.redisService.scanDel(RedisKeyUtils.userResourceIdKey("*", "*" as any, userId))
        ]);
    }
}
