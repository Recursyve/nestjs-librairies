import { FindAttributeOptions, WhereOptions } from "sequelize";
import { M, SequelizeUtils } from "../sequelize.utils";
import { IncludeConfig, IncludeModel, IncludeWhereModel } from "./include.model";
import { PathConfig, PathModel } from "./path.model";
import { CustomAttributesConfig, CustomAttributesModel } from "./custom-attributes.model";

export interface AttributesConfigModel {
    key: string;
    attributes?: FindAttributeOptions;
    path?: PathConfig;
    includes: IncludeConfig[];
    customAttributes: CustomAttributesConfig[];
}

export class AttributesConfig implements AttributesConfigModel {
    public attributes?: FindAttributeOptions;
    public searchableAttributes?: string[];
    public path?: PathConfig;
    public includes: IncludeConfig[] = [];
    public customAttributes: CustomAttributesConfig[] = [];
    public ignoreInSearch = false;

    constructor(public key: string) {
        this.path = {
            path: key
        };
    }

    public setAttributes(attributes?: FindAttributeOptions) {
        this.attributes = attributes;
    }

    public setSearchableAttributes(attributes: string[]) {
        this.searchableAttributes = attributes;
    }

    public setPath(path?: PathConfig) {
        this.path = path;
    }

    public containsPath(path: string) {
        return this.path?.path.startsWith(path);
    }

    public setIgnoreInPath(ignore: boolean) {
        this.ignoreInSearch = ignore;
    }

    public addInclude(include: IncludeConfig) {
        this.includes.push(include);
    }

    public addCustomAttribute(attribute: CustomAttributesConfig) {
        this.customAttributes.push(attribute);
    }

    public transformPathConfig(options?: object): PathModel {
        if (!options) {
            return this.path as PathModel;
        }

        if (this.path.where) {
            return {
                ...this.path,
                where: this.generateWhereConditions(this.path.where, options)
            };
        }

        return this.path as PathModel;
    }

    public transformAttributesConfig(options?: object): FindAttributeOptions {
        const customAttributes = this.getCustomAttributes(options);
        if (this.attributes) {
            return [
                ...this.attributes as string[],
                ...customAttributes.map(x => x.attribute)
            ];
        }
        if (!this.attributes && customAttributes.length) {
            return {
                include: customAttributes.map(x => x.attribute)
            };
        }
    }

    public transformIncludesConfig(options?: object): IncludeModel[] {
        return this.includes
            .map(x => {
                const customAttributes = this.getCustomAttributes(options, x.path);
                if (!customAttributes.length) {
                    return x;
                }

                if (x.attributes) {
                    return {
                        ...x,
                        attributes: [...x.attributes as string[], ...customAttributes.map(a => a.attribute)]
                    };
                } else {
                    return {
                        ...x,
                        attributes: {
                            include: customAttributes.map(a => a.attribute)
                        }
                    };
                }
            })
            .map(x => {
                if (!options) {
                    return {
                        path: x.path,
                        attributes: x.attributes
                    };
                }

                if (!x.where) {
                    return { path: x.path, attributes: x.attributes };
                }

                return {
                    ...x,
                    where: this.generateWhereConditions(x.where, options)
                };
            });
    }

    public getCustomAttributes(options?: object, path?: string): CustomAttributesModel[] {
        return this.customAttributes
            .filter(x => x.config.path === path)
            .map(x => ({
                key: x.key,
                attribute: x.transform(options, this.path.path),
                path: (x.config as any).path ? {
                    path: (x.config as any).path
                } : null
            } as CustomAttributesModel))
            .filter(x => x.attribute);
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
