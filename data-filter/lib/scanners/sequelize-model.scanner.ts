import { Injectable } from "@nestjs/common";
import { BaseAssociation, getAssociations, Model } from "sequelize-typescript";
import { FindAttributeOptions, IncludeOptions, Order } from "sequelize";
import { IncludeModel } from "../models/include.model";
import { M, SequelizeUtils } from "../sequelize.utils";
import { PathModel } from "../models/path.model";
import { SearchAttributesModel } from "../models/search-attributes.model";
import { OrderModel } from "..";

@Injectable()
export class SequelizeModelScanner {
    public getIncludes(
        model: typeof Model,
        path: PathModel,
        additionalIncludes: IncludeModel[],
        attributes?: FindAttributeOptions
    ): IncludeOptions[] {
        const objects = path.path.split(".");
        if (!objects.length) {
            return [];
        }

        const result: IncludeOptions[] = [];
        let includes: IncludeOptions[] = result;
        for (const obj of objects) {
            const association = this.findAssociation(model, obj);
            includes.push({
                as: association.getAs() as string,
                model: association.getAssociatedClass(),
                include: [],
                required: false
            });

            if (obj !== objects[objects.length - 1]) {
                model = includes[0].model as typeof Model;
                includes = includes[0].include as IncludeOptions[];
            }
        }

        if (attributes) {
            includes[0].attributes = SequelizeUtils.mergeAttributes(includes[0], { attributes: attributes });
        }
        if (path.where) {
            includes[0].where = SequelizeUtils.mergeWhere(includes[0].where, path.where);
            includes[0].required = !!path.required;
        }

        const addIncludes: IncludeOptions[][] = [];
        for (const include of additionalIncludes) {
            addIncludes.push(
                this.getIncludes(
                    includes[0].model as typeof Model,
                    {
                        path: include.path,
                        where: include.where,
                        required: include.required
                    },
                    [],
                    include.attributes
                )
            );
        }

        includes[0].include.push(...SequelizeUtils.reduceIncludes(addIncludes));

        return result;
    }

    public getAttributes(
        model: typeof Model,
        path: PathModel,
        additionalIncludes: IncludeModel[],
        attributes?: FindAttributeOptions
    ): SearchAttributesModel[] {
        const objects = path.path.split(".");
        if (!objects.length) {
            return [];
        }

        const result: SearchAttributesModel[] = [];
        for (const obj of objects) {
            const association = this.findAssociation(model, obj);
            model = association.getAssociatedClass();
        }
        attributes = attributes ? attributes : SequelizeUtils.getModelSearchableAttributes(model as typeof M);
        result.push(
            ...(attributes as string[]).map(a => ({
                name: a,
                key: SequelizeUtils.getAttributeFullName(a, path.path)
            }))
        );

        for (const include of additionalIncludes) {
            result.push(
                ...this.getAttributes(
                    model as typeof Model,
                    {
                        path: include.path
                    },
                    [],
                    include.attributes
                ).map(a => ({
                    name: a.name,
                    key: SequelizeUtils.getAttributeFullName(a.name, [path.path, include.path].join("."))
                }))
            );
        }

        return result;
    }

    public getOrder(model: typeof Model, orderObj: OrderModel): Order {
        if (!orderObj || !orderObj.column || orderObj.direction === "") {
            return;
        }

        const order = [];
        const values = orderObj.column.split(".");
        const column = values.pop();
        for (const value of values) {
            const association = this.findAssociation(model, value);
            model = association.getAssociatedClass();
            order.push({
                model,
                as: association.getAs()
            } as any);
        }
        order.push(column);
        order.push(orderObj.direction.toUpperCase());
        return [order] as Order;
    }

    private findAssociation(model: typeof Model, obj: string): BaseAssociation {
        const associations = getAssociations(model.prototype);

        const association = associations.find(a => a.getAs() === obj);
        if (!association) {
            throw new Error(`Unable to load association for ${obj}`);
        }
        return association;
    }
}
