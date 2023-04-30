export abstract class UserDeserializer<T> {
    public abstract deserializeUser(req: unknown): Promise<T | null>;
}
