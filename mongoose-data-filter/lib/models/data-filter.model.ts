import { Type } from "@nestjs/common";
import { Model } from "mongoose";

export interface DataFilterConfigModel {
    model: Type<any>;
}

export class DataFilterConfig implements DataFilterConfigModel {
    public model: Model<any>;

    public setModel(model: Model<any>) {
        this.model = model;
    }
}
