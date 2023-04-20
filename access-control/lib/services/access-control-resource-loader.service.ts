import { Injectable, Logger } from "@nestjs/common";
import { catchError, finalize, from, Observable, of } from "rxjs";
import {
    AccessActionType,
    AccessControlResources,
    PolicyResources,
    PolicyResourceTypes,
    Resources,
    Users,
} from "../models";
import { GetResourcesCommand } from "../commands";
import { CommandBus } from "@nestjs/cqrs";
import { RedisKeyUtils } from "../utils";
import { RedisService } from "@recursyve/nestjs-redis";

@Injectable()
export class AccessControlResourceLoaderService {
    private logger = new Logger(AccessControlResourceLoaderService.name);

    private fetchingResource = new Map<string, Observable<Resources>>();

    constructor(private commandBus: CommandBus, private redisService: RedisService) {}

    public loadResources(user: Users, resourceName: string): Observable<Resources> {
        const fetchKey = this.generateFetchKey(user, resourceName);
        if (this.fetchingResource.has(fetchKey)) {
            return this.fetchingResource.get(fetchKey);
        }

        const resources$ = from(this.fetchResources(user, resourceName));
        this.fetchingResource.set(fetchKey, resources$);

        return resources$.pipe(
            catchError((error) => {
                this.logger.error(`Error while loading resources for ${resourceName}`, error);
                return of(Resources.fromIds([]));
            }),
            finalize(() => this.fetchingResource.delete(fetchKey))
        );
    }

    private async fetchResources(user: Users, resourceName: string): Promise<Resources> {
        const policyResources = await this.commandBus.execute(new GetResourcesCommand(resourceName, user));

        await this.redisService.set(RedisKeyUtils.userAccessControlType(user, resourceName), policyResources.type);
        await this.redisService.set(RedisKeyUtils.userAccessControl(user, resourceName), "1");
        await this.setAccessRules(user, resourceName, policyResources);
        if (policyResources.type === PolicyResourceTypes.Resources) {
            return Resources.fromIds(policyResources.resources.filter((x) => x.rules.r).map((x) => x.resourceId));
        }
        if (policyResources.type === PolicyResourceTypes.Wildcard) {
            return Resources.all();
        }
        if (policyResources.type === PolicyResourceTypes.Condition) {
            return Resources.fromCondition(policyResources.condition.where);
        }
    }

    private generateFetchKey(user: Users, resourceName: string): string {
        return `${user.id}:${resourceName}`;
    }

    private async setAccessRules(user: Users, resourceName: string, resources: PolicyResources) {
        if (resources.type === PolicyResourceTypes.Resources) {
            await Promise.all(
                [AccessActionType.Read, AccessActionType.Update, AccessActionType.Delete].map((a) =>
                    this.setAccessAction(user, resourceName, resources.resources, a)
                )
            );
        } else if (resources.type === PolicyResourceTypes.Wildcard) {
            await this.redisService.set(
                RedisKeyUtils.userResourceActionWildcardKey(user, resourceName),
                JSON.stringify(resources.wildcard)
            );
        } else if (resources.type === PolicyResourceTypes.Condition) {
            await this.redisService.set(
                RedisKeyUtils.userResourceActionConditionKey(user, resourceName),
                JSON.stringify(resources.condition)
            );
        }
    }

    private async setAccessAction(
        user: Users,
        resourceName: string,
        resources: AccessControlResources[],
        action: AccessActionType
    ): Promise<void> {
        const values = resources
            .filter((resource) => resource.rules[action])
            .map((resource) => resource.resourceId.toString());
        await this.redisService.del(RedisKeyUtils.userResourceActionKey(user, resourceName, action));
        await this.redisService.lpush(RedisKeyUtils.userResourceActionKey(user, resourceName, action), ...values);
    }
}
