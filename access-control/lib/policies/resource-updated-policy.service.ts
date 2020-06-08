import { Injectable } from "@nestjs/common";
import { Model } from "sequelize-typescript";
import { UserResources } from "../models";
import { M } from "../utils";

@Injectable()
export abstract class ResourceUpdatedPolicy<T extends Model<T>> {
    public repository: typeof M;
    public parentRepository: typeof M;

    public get name(): string {
        return (this as any).constructor.name;
    }

    public async handle(before: T, after: T): Promise<UserResources[]> {
        const result = await this.getPolicies(before, after);
        return result
            .filter(x => !!x)
            .map(x => ({ ...x, table: this.repository.tableName }));
    }

    protected async getPolicies(before: T, after: T): Promise<UserResources[]> {
        return [];
    }
}
