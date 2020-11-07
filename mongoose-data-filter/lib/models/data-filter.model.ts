import { Type } from "@nestjs/common";
import { Model } from "mongoose";
import { MongoUtils } from "../mongo.utils";
import { AddFieldModel } from "./add-field.model";

export interface DataFilterConfigModel {
    model: Type<any>;
    fieldsToAdd: AddFieldModel[];
    attributes?: string[];
}

export class DataFilterConfig implements DataFilterConfigModel {
    public model: Model<any>;
    public fieldsToAdd: AddFieldModel[] = [];
    public attributes?: string[];

    public setModel(model: Model<any>) {
        this.model = model;
    }

    public setAttributes(attributes?: string[]) {
        this.attributes = attributes;
    }

    public addFieldToAdd(field: AddFieldModel) {
        this.fieldsToAdd.push(field);
    }

    public getFieldsToAdd(): [any, string[]] {
        if (!this.fieldsToAdd.length) {
            return [null, []];
        }

        const fields = MongoUtils.reduceFieldsToAdd(this.fieldsToAdd);
        const unwindFields = this.fieldsToAdd.filter(x => x.unwind).map(x => x.name);
        return [fields, unwindFields];
    }
}
