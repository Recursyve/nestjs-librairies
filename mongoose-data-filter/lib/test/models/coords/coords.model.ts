import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Locations } from "../locations/locations.model";

@Schema()
export class Coords {
    @Prop({
        type: Types.ObjectId,
        ref: Locations.name
    })
    location: string | Locations;

    @Prop({
        required: true
    })
    streetNumber: number;

    @Prop({
        required: true
    })
    address: string;

    @Prop()
    address2: string;

    @Prop({
        required: true
    })
    postalCode: string;
}
