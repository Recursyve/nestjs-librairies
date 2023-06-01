import { Prop, Schema } from "@nestjs/mongoose";

@Schema()
export class Locations {
    @Prop({
        required: true
    })
    value: string;

    @Prop()
    uniqueCode: string;
}
