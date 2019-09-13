import { Injectable } from "@nestjs/common";
import { DefinitionModel } from "./models/definition.model";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import { FindAttributeOptions, FindOptions, Identifier, IncludeOptions, Model, WhereOptions } from "sequelize";
import { M, SequelizeUtils } from "./sequelize.utils";
import { SearchAttributesModel } from "./models/search-attributes.model";

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

    public async findByPk(identifier: Identifier, conditions?: object): Promise<Data> {
        const options = this.generateFindOptions(conditions);
        const result = await this._model.findByPk(identifier, options);
        if (!result) {
            return result;
        }
        return this.reduceObject(result);
    }

    public async findOne(where?: WhereOptions, conditions?: object): Promise<Data> {
        const options = {
            ...this.generateFindOptions(conditions),
            where
        } as FindOptions;
        const result = await this._model.findOne(options);
        if (!result) {
            return result;
        }
        return this.reduceObject(result);
    }

    public async findAll(options?: FindOptions, conditions?: object): Promise<Data[]> {
        const result = await this._model.findAll({
            ...this.generateFindOptions(conditions),
            ...options
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
        return await this._model.count(options);
    }

    public generateFindOptions(conditions?: object): FindOptions {
        const includes: IncludeOptions[][] = this._definitions.map(x => {
            if (!x.path) {
                return [];
            }
            x.path = this.dataFilterScanner.getPath(this.dataDef, x.key, conditions);
            const additionalIncludes = this.dataFilterScanner.getInclude(this.dataDef, x.key, conditions);
            return this.sequelizeModelScanner.getIncludes(this._model, x.path, additionalIncludes, x.attributes);
        });

        if (this.findAttributes) {
            return {
                attributes: this.findAttributes,
                include: SequelizeUtils.reduceIncludes(includes)
            };
        }

        return {
            include: SequelizeUtils.reduceIncludes(includes)
        };
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
