import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import * as mongoose from "mongoose";
import { Coords } from "../coords/coords.model";

@Schema()
export class Places {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Coords.name })
    billingCoord?: Types.ObjectId | Coords;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Coords.name })
    geoCoord?: Types.ObjectId | Coords;
}
