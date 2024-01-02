import { FindAttributeOptions, Order } from "sequelize";
import { SequelizeUtils } from "../sequelize.utils";
import { DialectFormatterService } from "../services/dialect-formatter.service";
import { CustomAttributesConfig, CustomAttributesModel } from "./custom-attributes.model";
import { IncludeConfig, IncludeModel } from "./include.model";
import { PathConfig } from "./path.model";

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
        this.path = new PathConfig({
            path: key,
            paranoid: true
        });
    }

    public withContext(dialectFormatterService: DialectFormatterService): AttributesContext {
        return new AttributesContext(this, dialectFormatterService);
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
}

export class AttributesContext {
    constructor(private config: AttributesConfig, private dialectFormatterService: DialectFormatterService) {}

    public transformAttributesConfig(options?: object): FindAttributeOptions {
        const customAttributes = this.getCustomAttributes(options);
        if (this.config.attributes) {
            if (this.config.customAttributes.length) {
                return SequelizeUtils.ensureAttributesValidity(
                    SequelizeUtils.mergeAttributes(this.config.attributes, {
                        include: customAttributes.map(x => x.attribute)
                    })
                );
            }

            return SequelizeUtils.ensureAttributesValidity(this.config.attributes);
        }
        if (!this.config.attributes && customAttributes.length) {
            return {
                include: customAttributes.map(x => x.attribute)
            };
        }
    }

    public transformIncludesConfig(options?: object): IncludeModel[] {
        return this.config.includes
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
                    const {where, ...values} = x;
                    return values;
                }

                if (!x.where) {
                    return x;
                }

                return {
                    ...x,
                    where: SequelizeUtils.generateWhereConditions(x.where, options)
                };
            });
    }

    public getCustomAttributes(options?: object, path?: string): CustomAttributesModel[] {
        return this.config.customAttributes
            .filter(x => x.config.path === path)
            .map(x => ({
                key: x.key,
                attribute: x.withContext(this.dialectFormatterService).transform(options, this.config.path.path),
                path: (x.config as any).path ? {
                    path: (x.config as any).path,
                    paranoid: true
                } : null
            } as CustomAttributesModel))
            .filter(x => x.attribute);
    }
}
