import { Injectable, Logger } from "@nestjs/common";
import { from, Observable, of } from "rxjs";
import { catchError, finalize } from "rxjs/operators";
import {
    AccessActionType,
    AccessControlResources,
    Users,
} from "../models";
import { GetResourcesCommand } from "../commands";
import { CommandBus } from "@nestjs/cqrs";
import { RedisKeyUtils } from "../utils";
import { RedisService } from "@recursyve/nestjs-redis";

@Injectable()
export class AccessControlResourceLoaderService {
    private logger = new Logger(AccessControlResourceLoaderService.name);

    private fetchingResources = new Map<string, Observable<number[]>>();

    constructor(private commandBus: CommandBus, private redisService: RedisService) {}

    public loadResources(user: Users, resourceName: string): Observable<number[]> {
        const fetchKey = this.generateFetchKey(user, resourceName);
        if (this.fetchingResources.has(fetchKey)) {
            return this.fetchingResources.get(fetchKey);
        }

        const resources$ = from(this.fetchResources(user, resourceName));
        this.fetchingResources.set(fetchKey, resources$);

        return resources$.pipe(
            catchError((error) => {
                this.logger.error(`Error while loading resources for ${resourceName}`, error);
                return of([]);
            }),
            finalize(() => this.fetchingResources.delete(fetchKey))
        );
    }

    private async fetchResources(user: Users, resourceName: string): Promise<number[]> {
        const resources: AccessControlResources[] = await this.commandBus.execute(
            new GetResourcesCommand(resourceName, user)
        );
        await this.setAccessRules(user, resourceName, resources);

        await this.redisService.set(RedisKeyUtils.userAccessControl(user, resourceName), "1");
        return resources.filter(x => x.rules.r).map(x => x.resourceId);
    }

    private generateFetchKey(user: Users, resourceName: string): string {
        return `${user.id}:${resourceName}`;
    }

    private async setAccessRules(user: Users, resourceName: string, resources: AccessControlResources[]) {
        for (const a of [AccessActionType.Read, AccessActionType.Update, AccessActionType.Delete]) {
            await this.setAccessAction(user, resourceName, resources, a);
        }
    }

    private async setAccessAction(
        user: Users,
        resourceName: string,
        resources: AccessControlResources[],
        action: AccessActionType
    ): Promise<void> {
        const values = resources
            .filter(resource => resource.rules[action])
            .map(resource => resource.resourceId.toString());
        await this.redisService.del(RedisKeyUtils.userResourceActionKey(user, resourceName, action));
        await this.redisService.lpush(RedisKeyUtils.userResourceActionKey(user, resourceName, action), ...values);
    }
}
