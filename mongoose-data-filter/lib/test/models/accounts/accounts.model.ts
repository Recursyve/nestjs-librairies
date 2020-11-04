import { Prop, Schema } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Coords } from "../coords/coords.model";

@Schema()
export class Accounts {
    @Prop({
        required: true
    })
    userId: string;

    @Prop({
        required: true
    })
    email: string;

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: Coords.name
    })
    coord: string | Coords;
}
