import { Injectable } from "@nestjs/common";
import { isDefined } from "@recursyve/nice-ts-utils";

import type { UserResources } from "../models/user-resources.model";

@Injectable()
export abstract class ResourceDeletedPolicy<T> {
    public type!: string;
    public resourceName!: string;
    public parentResourceName!: string;

    public get name(): string {
        return this.constructor.name;
    }

    public async handle(resource: T): Promise<UserResources[]> {
        const result = await this.getPolicies(resource);
        return result.filter(isDefined);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async getPolicies(resource: T): Promise<UserResources[]> {
        return Promise.resolve([]);
    }
}
