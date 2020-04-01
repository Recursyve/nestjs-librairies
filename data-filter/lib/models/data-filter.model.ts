import { FindAttributeOptions } from "sequelize";
import { Model } from "sequelize-typescript";
import { CustomAttributesConfig, CustomAttributesModel } from "./custom-attributes.model";
import { IncludeConfig } from "./include.model";

export interface DataFilterConfigModel {
    model: typeof Model;
    attributes?: FindAttributeOptions;
    exportColumns?: string[];
    customAttributes: CustomAttributesConfig[];
}

export class DataFilterConfig implements DataFilterConfigModel {
    public model: typeof Model;
    public attributes?: FindAttributeOptions;
    public exportColumns?: string[];
    public customAttributes: CustomAttributesConfig[] = [];

    public setModel(model: typeof Model) {
        this.model = model;
    }

    public setAttributes(attributes?: FindAttributeOptions) {
        this.attributes = attributes;
    }

    public setExportColumns(exportColumns: string[]) {
        this.exportColumns = exportColumns;
    }

    public addCustomAttribute(attribute: CustomAttributesConfig) {
        this.customAttributes.push(attribute);
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

    public getCustomAttributes(options?: object): CustomAttributesModel[] {
        return this.customAttributes
            .map(x => ({
                key: x.key,
                attribute: x.transform(options),
                path: (x.config as any).path ? {
                    path: (x.config as any).path
                } : null
            } as CustomAttributesModel))
            .filter(x => x.attribute);
    }

    public getCustomAttributesIncludes(): IncludeConfig[] {
        return this.customAttributes
            .filter(x => x.config.path)
            .map(x => ({
                attributes: [],
                path: x.config.path
            }));
    }
}
