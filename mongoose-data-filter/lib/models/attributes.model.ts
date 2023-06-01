import { MongoUtils } from "../mongo.utils";
import { AddFieldModel } from "./add-field.model";
import { IncludeConfig, IncludeWhereModel } from "./include.model";
import { PathConfig, PathModel } from "./path.model";
import { FilterQuery } from "mongoose";

export interface AttributesConfigModel {
    key: string;
    path: PathConfig;
    fieldsToAdd: AddFieldModel[];
    includes: IncludeConfig[];
    ignoreInSearch: boolean;
    attributes?: string[];
}

export class AttributesConfig implements AttributesConfigModel {
    public path: PathConfig;
    public fieldsToAdd: AddFieldModel[] = [];
    public includes: IncludeConfig[] = [];
    public ignoreInSearch = false;
    public attributes?: string[];

    constructor(public key: string) {
        this.path = {
            path: key
        };
    }

    public setPath(path: PathConfig) {
        this.path = path;
    }

    public setAttributes(attributes?: string[]) {
        this.attributes = attributes;
    }

    public setIgnoreInPath(ignore: boolean) {
        this.ignoreInSearch = ignore;
    }

    public addInclude(include: IncludeConfig) {
        this.includes.push(include);
    }

    public addFieldToAdd(field: AddFieldModel) {
        this.fieldsToAdd.push(field);
    }

    public transformPathConfig(options?: object): PathModel {
        if (this.path.where) {
            return {
                ...this.path,
                where: this.generateWhereConditions(this.path.where, options)
            };
        }

        return this.path as PathModel;
    }

    public getFieldsToAdd(): any {
        if (!this.fieldsToAdd.length) {
            return [null, []];
        }

        return MongoUtils.reduceFieldsToAdd(this.fieldsToAdd);
    }

    private generateWhereConditions(model: IncludeWhereModel, options?: object): FilterQuery<any> {
        const where = {};
        for (const key in model) {
            if (!model.hasOwnProperty(key)) {
                continue;
            }

            const value = model[key](options);
            if (typeof value !== "undefined") {
                where[key] = value;
            }
        }

        return where;
    }
}
