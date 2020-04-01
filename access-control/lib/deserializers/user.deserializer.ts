import { Users } from "../models";

export abstract class UserDeserializer {
    public abstract async deserializeUser(req: unknown): Promise<Users>;
}
