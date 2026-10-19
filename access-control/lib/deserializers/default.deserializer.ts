import type { Users } from "../models/users.model";
import { UserDeserializer } from "./user.deserializer";

export class DefaultDeserializer extends UserDeserializer {
    public async deserializeUser(request: unknown): Promise<Users | null> {
        if (!this.isRequest(request)) {
            return null;
        }

        return Promise.resolve(request.user);
    }

    private isRequest(request: unknown): request is { user: Users } {
        return typeof request === "object" && request !== null && "user" in request;
    }
}
