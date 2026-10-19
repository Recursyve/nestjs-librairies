import type { Users } from "../models/users.model";

export abstract class UserDeserializer {
    public abstract deserializeUser(req: unknown): Promise<Users | null>;
}
