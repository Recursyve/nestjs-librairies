import { Injectable } from "@nestjs/common";
import { isDefined } from "@recursyve/nice-ts-utils";

import type { UserResources } from "../models/user-resources.model";

@Injectable()
export abstract class ResourceUpdatedPolicy<T> {
    public type!: string;
    public resourceName!: string;
    public parentResourceName!: string;

    public get name(): string {
        return this.constructor.name;
    }

    public async handle(before: T, after: T): Promise<UserResources[]> {
        const result = await this.getPolicies(before, after);
        return result.filter(isDefined).map((entry) => ({ ...entry, resourceName: this.resourceName }));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async getPolicies(before: T, after: T): Promise<UserResources[]> {
        return Promise.resolve([]);
    }
}
