import { UserDeserializer } from "./user.deserializer";

export class DefaultDeserializer<T> extends UserDeserializer<T> {
    public async deserializeUser(req: any): Promise<T> {
        return req.user;
    }
}
