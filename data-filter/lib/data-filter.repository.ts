import { Injectable } from "@nestjs/common";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import {
    FindOptions,
    Identifier,
    IncludeOptions,
    Model,
    ProjectionAlias,
    WhereOptions
} from "sequelize";
import { M, SequelizeUtils } from "./sequelize.utils";
import { SearchAttributesModel } from "./models/search-attributes.model";
import { OrderModel } from "./models/filter.model";
import { DataFilterConfig } from "./models/data-filter.model";
import { AttributesConfig } from "./models/attributes.model";
import { PathModel } from "./models/path.model";

@Injectable()
export class DataFilterRepository<Data> {
    private _config: DataFilterConfig;
    private _definitions: AttributesConfig[];

    public get model(): typeof M {
        return this._config.model as typeof M;
    }

    constructor(
        private dataDef: any,
        private dataFilterScanner: DataFilterScanner,
        private sequelizeModelScanner: SequelizeModelScanner
    ) {
        this.init();
    }

    public async findByPk(identifier: Identifier, options?: FindOptions, conditions?: object): Promise<Data> {
        const result = await this.model.findByPk(identifier, {
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result) {
            return result;
        }
        return this.reduceObject(result);
    }

    public async findOne(options?: FindOptions, conditions?: object): Promise<Data> {
        const result = await this.model.findOne({
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result) {
            return result;
        }
        return this.reduceObject(result);
    }

    public async findAll(options?: FindOptions, conditions?: object): Promise<Data[]> {
        const result = await this.model.findAll({
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result || !result.length) {
            return result;
        }
        return result.map(x => this.reduceObject(x));
    }

    public async count(where?: WhereOptions, conditions?: object): Promise<number> {
        const options = {
            ...this.generateFindOptions(conditions),
            where
        };
        return this.model.count(options);
    }

    public generateFindOptions(conditions?: object): FindOptions {
        const includes: IncludeOptions[][] = [
            ...this._definitions.map(x => {
                if (!x.path) {
                    return [];
                }
                const path = x.transformPathConfig(conditions);
                const attributes = x.transformAttributesConfig(conditions);
                const additionalIncludes = x.transformIncludesConfig(conditions);
                return this.sequelizeModelScanner.getIncludes(this.model, path, additionalIncludes, attributes);
            }),
            ...this._config.getCustomAttributesIncludes().map(x => this.sequelizeModelScanner.getIncludes(this.model, {
                path: x.path
            }, [], x.attributes))
        ];

        const attributes = this._config.transformAttributesConfig(conditions);

        if (attributes) {
            return {
                attributes: attributes,
                include: SequelizeUtils.reduceIncludes(includes)
            };
        }

        return {
            include: SequelizeUtils.reduceIncludes(includes)
        };
    }

    public generateOrderInclude(order: OrderModel): IncludeOptions[] {
        if (!order || !order.column || order.direction === "") {
            return [];
        }

        const objects = order.column.split(".");
        const column = objects.pop();
        const definition = this._definitions.filter(x => x.attributes).find(x => {
            return (x.attributes as (string | ProjectionAlias)[]).some(attribute => {
                if (typeof attribute === "string") {
                    return attribute === column;
                }
                const attr = attribute[attribute.length - 1];
                return attr === column
            });
        });

        if (!definition) {
            return [];
        }

        if (!definition.path) {
            return [];
        }
        const path = definition.transformPathConfig({});
        const additionalIncludes = definition.transformIncludesConfig({});
        const attributes = definition.transformAttributesConfig({});
        return this.sequelizeModelScanner.getIncludes(this.model, path, additionalIncludes, attributes);
    }

    public reduceObject(result: any): Data {
        const r = result instanceof Model ? result.toJSON() : result;
        const data = new this.dataDef.prototype.constructor({}, { isNewRecord: false });
        Object.assign(data, r);
        if (data instanceof Model) {
            (data as any).dataValues = {
                ...r
            };
        }

        for (const def of this._definitions) {
            if (def.path) {
                data[def.key] = SequelizeUtils.reduceModelFromPath(result, def.path.path);
                if (data instanceof Model) {
                    data.setDataValue(def.key as any, SequelizeUtils.reduceModelFromPath(result, def.path.path));
                }
                continue;
            }

            data[def.key] = result[def.key];
        }

        return data;
    }

    public getSearchAttributes(): SearchAttributesModel[] {
        const attributes: SearchAttributesModel[] = [];
        const modelAttr = this._config.attributes
            ? (this._config.attributes as string[])
            : SequelizeUtils.getModelSearchableAttributes(this.model);
        attributes.push(
            ...modelAttr.map(a => ({
                name: a,
                key: a
            }))
        );

        for (const definition of this._definitions) {
            if (!definition.path) {
                continue;
            }

            const additionalIncludes = definition.transformIncludesConfig({});
            attributes.push(
                ...this.sequelizeModelScanner.getAttributes(
                    this.model,
                    definition.path as PathModel,
                    additionalIncludes,
                    definition.attributes
                )
            );
        }

        return attributes;
    }

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
    }
}
