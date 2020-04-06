export abstract class UserDeserializer<T> {
    public abstract async deserializeUser(req: unknown): Promise<T>;
}
