import type { Users } from "../models";
import { UserDeserializer } from "./user.deserializer";

export class DefaultDeserializer extends UserDeserializer {
    public async deserializeUser(req: any): Promise<Users> {
        return req.user;
    }
}
