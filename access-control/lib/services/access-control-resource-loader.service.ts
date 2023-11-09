import { Injectable, Logger } from "@nestjs/common";
import { catchError, finalize, from, Observable, of } from "rxjs";
import { PolicyResourceTypes, Resources, Users } from "../models";
import { GetResourcesCommand } from "../commands";
import { CommandBus } from "@nestjs/cqrs";
import { ResourceAccessService } from "./resource-access.service";

@Injectable()
export class AccessControlResourceLoaderService {
    private logger = new Logger(AccessControlResourceLoaderService.name);

    private fetchingResources = new Map<string, Observable<Resources>>();

    constructor(
        private commandBus: CommandBus,
        private resourceAccessService: ResourceAccessService
    ) {}

    public loadResources(user: Users, resourceName: string): Observable<Resources> {
        const fetchKey = this.generateFetchKey(user, resourceName);
        if (this.fetchingResources.has(fetchKey)) {
            return this.fetchingResources.get(fetchKey);
        }

        const resources$ = from(this.fetchResources(user, resourceName));
        this.fetchingResources.set(fetchKey, resources$);

        return resources$.pipe(
            catchError((error) => {
                this.logger.error(`Error while loading resources for ${resourceName}`, error);
                return of(Resources.fromIds([]));
            }),
            finalize(() => this.fetchingResources.delete(fetchKey))
        );
    }

    private async fetchResources(user: Users, resourceName: string): Promise<Resources> {
        const policyResources = await this.commandBus.execute(new GetResourcesCommand(resourceName, user));

        await this.resourceAccessService.setUserAccessRules(user, resourceName, policyResources);
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
}
