import { Injectable } from "@nestjs/common";
import { Model } from "sequelize-typescript";
import { DeletedResources } from "../models/deleted-resources.model";
import { M } from "../utils";

@Injectable()
export abstract class ResourceDeletedPolicy<T extends Model<T>> {
    public repository: typeof M;
    public parentRepository: typeof M;

    public get name(): string {
        return (this as any).constructor.name;
    }

    public async handle(resource: T): Promise<DeletedResources[]> {
        const result = await this.getPolicies(resource);
        return result
            .filter(x => !!x)
            .map(x => ({ ...x, table: this.repository.tableName }));
    }

    protected async getPolicies(resource: T): Promise<DeletedResources[]> {
        return [];
    }
}