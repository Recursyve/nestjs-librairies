// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IConfigProvider<Options = unknown> {
    getValue(key: string, options?: Options): Promise<string | null | undefined>;

    // Called once the config model has been instantiated and values has been loaded.
    // This can be used to register functions such as `reload`.
    hydrate?(config: object): Promise<void>;
}
