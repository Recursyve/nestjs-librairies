import { UserDeserializer } from "./user.deserializer";
import { Users } from "../models";

export class DefaultDeserializer extends UserDeserializer {
    public async deserializeUser(req: any): Promise<Users> {
        return req.user;
    }
}
