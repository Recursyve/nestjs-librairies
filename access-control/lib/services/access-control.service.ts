import { Injectable } from "@nestjs/common";
import { RedisService } from "@recursyve/nestjs-redis";
import { CommandBus } from "@nestjs/cqrs";
import { Model } from "sequelize-typescript";
import { ResourceAccessControlService } from "./resource-access-control.service";
import { AccessActionType, Users } from "../models";
import { M, RedisKeyUtils } from "../utils";

@Injectable()
export class AccessControlService {
    constructor(private readonly redisService: RedisService, private readonly commandBus: CommandBus) {}

    public forModel(model: typeof Model): ResourceAccessControlService {
        const service = new ResourceAccessControlService(model as typeof M);
        service.redisService = this.redisService;
        service.commandBus = this.commandBus;
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
