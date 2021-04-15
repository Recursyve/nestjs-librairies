import { Users } from "../models";

export abstract class UserDeserializer {
    public abstract deserializeUser(req: unknown): Promise<Users>;
}
