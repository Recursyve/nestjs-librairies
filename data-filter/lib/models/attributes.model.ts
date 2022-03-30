import { FindAttributeOptions, Order, WhereOptions } from "sequelize";
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
    public path: PathConfig;
    public includes: IncludeConfig[] = [];
    public customAttributes: CustomAttributesConfig[] = [];
    public ignoreInSearch = false;

    constructor(public key: string) {
        this.path = {
            path: key,
            paranoid: true
        };
    }

    public setAttributes(attributes?: FindAttributeOptions) {
        this.attributes = attributes;
    }

    public setSearchableAttributes(attributes: string[]) {
        this.searchableAttributes = attributes;
    }

    public setPath(path: PathConfig) {
        this.path = path;
    }

    public containsPath(path: string) {
        return this.path?.path.startsWith(path);
    }

    public setIgnoreInPath(ignore: boolean) {
        this.ignoreInSearch = ignore;
    }

    public setSeparate(): void {
        this.path.separate = true;
    }

    public setOrder(order: Order): void {
        this.path.order = order;
    }

    public addInclude(include: IncludeConfig) {
        this.includes.push(include);
    }

    public addCustomAttribute(attribute: CustomAttributesConfig) {
        this.customAttributes.push(attribute);
    }

    public transformPathConfig(options?: object): PathModel {
        if (!options) {
            const { where, ...path } = this.path;
            return path as PathModel;
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
                    const { where, ...values } = x;
                    return values;
                }

                if (!x.where) {
                    return x;
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
                    path: (x.config as any).path,
                    paranoid: true
                } : null
            } as CustomAttributesModel))
            .filter(x => x.attribute);
    }

    private generateWhereConditions(model: IncludeWhereModel, options?: object): WhereOptions {
        const where = {};
        const keys = [
            ...Object.keys(model),
            ...Object.getOwnPropertySymbols(model)
        ];
        for (const key of keys) {
            if (!model.hasOwnProperty(key)) {
                continue;
            }

            const value = model[key as any](options);
            if (typeof value !== "undefined") {
                where[key] = value;
            }
        }

        return where;
    }
}
