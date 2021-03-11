import { Injectable } from "@nestjs/common";
import { FindAttributeOptions, IncludeOptions, Order } from "sequelize";
import { Association, BaseAssociation, getAssociations, Model } from "sequelize-typescript";
import { OrderModel } from "..";
import { IncludeModel } from "../models/include.model";
import { PathModel } from "../models/path.model";
import { SearchAttributesModel } from "../models/search-attributes.model";
import { M, SequelizeUtils } from "../sequelize.utils";

@Injectable()
export class SequelizeModelScanner {
    public getIncludes(
        model: typeof Model,
        path: PathModel,
        additionalIncludes: IncludeModel[],
        attributes?: FindAttributeOptions,
        ignoreAttributes = false
    ): IncludeOptions[] {
        const objects = path?.path?.split(".");
        if (!objects?.length) {
            return [];
        }

        const result: IncludeOptions[] = [];
        let includes: IncludeOptions[] = result;
        for (const obj of objects) {
            const association = this.findAssociation(model, obj);
            includes.push({
                as: association.getAs() as string,
                model: association.getAssociatedClass(),
                attributes: ignoreAttributes ? [] : undefined,
                include: [],
                required: false
            });

            if (obj !== objects[objects.length - 1]) {
                model = includes[0].model as typeof Model;
                includes = includes[0].include as IncludeOptions[];
            }
        }

        if (attributes) {
            includes[0].attributes = ignoreAttributes ? [] : SequelizeUtils.mergeAttributes(includes[0], { attributes: attributes });
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
                    include.attributes,
                    ignoreAttributes
                )
            );
        }

        includes[0].include.push(...SequelizeUtils.reduceIncludes(addIncludes, ignoreAttributes));

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
        attributes = attributes ?
            SequelizeUtils.getModelSearchableFieldAttributes(model as typeof M, attributes as string[]) :
            SequelizeUtils.getModelSearchableAttributes(model as typeof M);
        result.push(
            ...(attributes as string[]).map(a => ({
                name: a,
                key: SequelizeUtils.getAttributeFullName(a, path.path)
            }))
        );

        for (const include of additionalIncludes) {
            if (include.ignoreInSearch) {
                continue;
            }

            result.push(
                ...this.getAttributes(
                    model as typeof Model,
                    {
                        path: include.path
                    },
                    [],
                    include.searchableAttributes ?? include.attributes
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

    public getGroup(model: typeof Model, orderObj: OrderModel): string[] {
        if (!orderObj || !orderObj.column || orderObj.direction === "") {
            return;
        }

        const group: string[] = [];
        const values = orderObj.column.split(".");
        const column = values.pop();
        for (const value of values) {
            const association = this.findAssociation(model, value);
            model = association.getAssociatedClass();
            group.push(value);
        }
        return [
            SequelizeUtils.getOrderFullName("id", group),
            SequelizeUtils.getOrderFullName(SequelizeUtils.findColumnFieldName(model as typeof M, column), group)
        ];
    }

    public getOrderIncludes(model: typeof Model, orderObj: OrderModel): IncludeOptions[] {
        if (!orderObj || !orderObj.column || orderObj.direction === "") {
            return [];
        }

        const values = orderObj.column.split(".");
        if (values.length <= 1) {
            return [];
        }

        const column = values.pop();
        const result: IncludeOptions[] = [];
        let includes: IncludeOptions[] = result;
        for (const value of values) {
            const association = this.findAssociation(model, value);
            includes.push({
                as: association.getAs() as string,
                model: association.getAssociatedClass(),
                attributes: [],
                include: [],
                required: false,
                through: association.getAssociation() === Association.BelongsToMany ? {
                    attributes: []
                } : undefined
            });

            if (value !== values[values.length - 1]) {
                model = includes[0].model as typeof Model;
                includes = includes[0].include as IncludeOptions[];
            }
        }

        includes[0].attributes = [column];
        return result;
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
