import { Injectable } from "@nestjs/common";
import { DefinitionModel } from "./models/definition.model";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import {
    FindAttributeOptions,
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

@Injectable()
export class DataFilterRepository<Data> {
    private _model: typeof M;
    private _definitions: DefinitionModel[];
    private findAttributes: FindAttributeOptions;

    public get definitions(): DefinitionModel[] {
        return this._definitions;
    }

    public get model(): typeof M {
        return this._model;
    }

    constructor(
        private dataDef: any,
        private dataFilterScanner: DataFilterScanner,
        private sequelizeModelScanner: SequelizeModelScanner
    ) {
        this.init();
    }

    public async findByPk(identifier: Identifier, options?: FindOptions, conditions?: object): Promise<Data> {
        const result = await this._model.findByPk(identifier, {
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result) {
            return result;
        }
        return this.reduceObject(result);
    }

    public async findOne(options?: FindOptions, conditions?: object): Promise<Data> {
        const result = await this._model.findOne({
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result) {
            return result;
        }
        return this.reduceObject(result);
    }

    public async findAll(options?: FindOptions, conditions?: object): Promise<Data[]> {
        const result = await this._model.findAll({
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
        return this._model.count(options);
    }

    public generateFindOptions(conditions?: object): FindOptions {
        const includes: IncludeOptions[][] = this._definitions.map(x => {
            if (!x.path) {
                return [];
            }
            x.path = this.dataFilterScanner.getPath(this.dataDef, x.key, conditions);

            const customAttributes = this.dataFilterScanner.getCustomAttributes(this.dataDef, x.key, x.path, conditions);
            let attributes = (x.attributes ? x.attributes : undefined) as (string | ProjectionAlias)[];
            if (customAttributes.length) {
                attributes = [
                    ...(attributes ?? []),
                    ...customAttributes.filter(a => !a.path || a.path.path === x.path.path).map(a => a.attribute)
                ];
            }

            const additionalIncludes = this.dataFilterScanner.getInclude(this.dataDef, x.key, conditions);
            additionalIncludes.forEach(i => {
                const customAttribute = customAttributes.find(a => a.path?.path === i.path);
                if (customAttribute) {
                    if (i.attributes) {
                        i.attributes = [...i.attributes as string[] ?? [], customAttribute.attribute] as (string | ProjectionAlias)[];
                    } else {
                        i.attributes = {
                            include: [customAttribute.attribute]
                        }
                    }
                }
            });
            return this.sequelizeModelScanner.getIncludes(this._model, x.path, additionalIncludes, attributes);
        });

        const customAttributes = this.dataFilterScanner.getModelCustomAttributes(this.dataDef, conditions);
        if (customAttributes.length) {
            includes.push(...customAttributes.filter(x => x.path).map(x =>
                this.sequelizeModelScanner.getIncludes(this._model, x.path, [])
            ));
        }

        if (this.findAttributes) {
            return {
                attributes: [...this.findAttributes as string[], ...customAttributes.map(x => x.attribute)],
                include: SequelizeUtils.reduceIncludes(includes)
            };
        }
        if (customAttributes.length) {
            return {
                attributes: {
                    include: customAttributes.map(x => x.attribute)
                },
                include: SequelizeUtils.reduceIncludes(includes)
            }
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
        definition.path = this.dataFilterScanner.getPath(this.dataDef, definition.key, {});
        const additionalIncludes = this.dataFilterScanner.getInclude(this.dataDef, definition.key, {});

        return this.sequelizeModelScanner.getIncludes(this._model, definition.path, additionalIncludes, definition.attributes);
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
        const modelAttr = this.findAttributes
            ? (this.findAttributes as string[])
            : SequelizeUtils.getModelSearchableAttributes(this._model);
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

            const additionalIncludes = this.dataFilterScanner.getInclude(this.dataDef, definition.key, {});
            attributes.push(
                ...this.sequelizeModelScanner.getAttributes(
                    this._model,
                    definition.path,
                    additionalIncludes,
                    definition.attributes
                )
            );
        }

        return attributes;
    }

    private init() {
        this._model = this.dataFilterScanner.getModel(this.dataDef);
        this.findAttributes = this.dataFilterScanner.getModelAttributes(this.dataDef);

        const attributes = this.dataFilterScanner.getAttributes(this.dataDef);
        this._definitions = attributes.map(a => {
            return {
                key: a.key,
                path: this.dataFilterScanner.getPath(this.dataDef, a.key),
                attributes: a.attributes
            };
        });
    }
}
