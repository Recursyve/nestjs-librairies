import { Injectable, Logger } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { catchError, finalize, from, map, Observable, of } from "rxjs";

import { PolicyResourceTypes, Resources } from "../models/resources.model";
import type { Users } from "../models/users.model";
import { GetResourcesQuery } from "../queries/get-resources.query";
import { ResourceAccessService } from "./resource-access.service";

@Injectable()
export class AccessControlResourceLoaderService {
    private readonly logger = new Logger(AccessControlResourceLoaderService.name);

    private readonly fetchingResources = new Map<string, Observable<Resources | null>>();

    constructor(
        private readonly queryBus: QueryBus,
        private readonly resourceAccessService: ResourceAccessService
    ) {}

    public loadResources(user: Users, resourceName: string): Observable<Resources> {
        const fetchKey = this.generateFetchKey(user, resourceName);
        if (this.fetchingResources.has(fetchKey)) {
            return this.fetchingResources.get(fetchKey) as Observable<Resources>;
        }

        const resources$ = from(this.fetchResources(user, resourceName)).pipe(
            map((res) => res ?? Resources.fromIds([]))
        );

        this.fetchingResources.set(fetchKey, resources$);

        return resources$.pipe(
            catchError((error) => {
                this.logger.error(`Error while loading resources for ${resourceName}`, error);
                return of(Resources.fromIds([]));
            }),
            finalize(() => this.fetchingResources.delete(fetchKey))
        );
    }

    private async fetchResources(user: Users, resourceName: string): Promise<Resources | null> {
        const policyResources = await this.queryBus.execute(new GetResourcesQuery(resourceName, user));

        await this.resourceAccessService.setUserAccessRules(user, resourceName, policyResources);

        switch (policyResources.type) {
            case PolicyResourceTypes.Condition: {
                const condition = policyResources.condition;
                if (!condition) {
                    return null;
                }
                return Resources.fromCondition(condition.where);
            }

            case PolicyResourceTypes.Resources: {
                const resources = policyResources.resources ?? [];
                return Resources.fromIds(resources.filter((x) => x.rules.r).map((x) => x.resourceId));
            }

            case PolicyResourceTypes.Wildcard: {
                return Resources.all();
            }
        }
    }

    private generateFetchKey(user: Users, resourceName: string): string {
        return `${user.id}:${resourceName}`;
    }
}
