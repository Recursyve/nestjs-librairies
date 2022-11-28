export abstract class ConfigProvider {
    public abstract getValue(key: string): Promise<string>;
}
