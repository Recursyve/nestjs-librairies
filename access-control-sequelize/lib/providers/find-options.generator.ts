import { Injectable } from "@nestjs/common";
import { AccessControlService, Users } from "@recursyve/nestjs-access-control";
import { FindOptions } from "sequelize";
import { Model } from "sequelize-typescript";
import { generateWhereOptionFromAccessControlResource } from "../utils/where-option-generator";

@Injectable()
export class SequelizeAccessControlFindOptionsGenerator<T extends Model<object, object>> {
    constructor(private readonly accessControlService: AccessControlService) {}

    public async generateFindOptions(model: typeof Model<object, object>, user: Users): Promise<FindOptions<T>> {
        const repository = this.accessControlService.forModel(model);
        const resource = await repository.getResources(user);
        if (!resource) {
            return {};
        }

        const where = generateWhereOptionFromAccessControlResource(resource);
        if (!where) {
            return {};
        }

        return {
            where
        };
    }
}
