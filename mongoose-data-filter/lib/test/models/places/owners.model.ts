import { Prop, Schema } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { Accounts } from "../accounts/accounts.model";
import { Places } from "./places.model";

@Schema()
export class Owners {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Accounts.name })
    account: Types.ObjectId | Accounts;

    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "Places" })
    places: (Types.ObjectId | Places)[];
}
