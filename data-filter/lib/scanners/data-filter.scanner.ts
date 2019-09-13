import { Injectable } from "@nestjs/common";
import { WhereOptions } from "sequelize";
import { ATTRIBUTES, EXPORTS, INCLUDE, MODEL, MODEL_ATTRIBUTES, PATH } from "../constant";
import { AttributesModel } from "../models/attributes.model";
import { IncludeConfig, IncludeModel, IncludeWhereModel } from "../models/include.model";
import { PathModel } from "../models/path.model";

@Injectable()
export class DataFilterScanner {
    public getModel(target: any) {
        return Reflect.getMetadata(MODEL, target);
    }

    public getModelAttributes(target: any) {
        return Reflect.getMetadata(MODEL_ATTRIBUTES, target);
    }

    public getPath(target: any, property: string, options?: object): PathModel {
        const path = Reflect.getMetadata(PATH.replace("{{path}}", property), target.prototype);
        if (!path) {
            return path;
        }

        if (!options) {
            return path;
        }

        if (path.where) {
            return {
                ...path,
                where: this.generateWhereConditions(path.where, options)
            };
        }

        return path;
    }

    public getAttributes(target: any): AttributesModel[] {
        return Reflect.getMetadata(ATTRIBUTES, target.prototype) || [];
    }

    public getInclude(target: any, property: string, options?: object): IncludeModel[] {
        const includes: IncludeConfig[] =
            Reflect.getMetadata(INCLUDE.replace("{{include}}", property), target.prototype) || [];

        if (!options) {
            return includes.map(x => ({ path: x.path, attributes: x.attributes }));
        }

        return includes.map(x => {
            if (!x.where) {
                return { path: x.path, attributes: x.attributes };
            }

            return {
                ...x,
                where: this.generateWhereConditions(x.where, options)
            };
        });
    }

    public getExports(target: any): string[] {
        return Reflect.getMetadata(EXPORTS, target);
    }

    private generateWhereConditions(model: IncludeWhereModel, options?: object): WhereOptions {
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
