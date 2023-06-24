import { ConfigTransformerService } from "../services/config-transformer.service";

export interface IConfigProvider {
    getValue<Options>(key: string, options?: Options): Promise<string>;

    // Called once the config model has been instantiated and values has been loaded.
    // This can be used to register functions such as `reload`.
    hydrate?<T extends Object>(config: T, configTransformerService: ConfigTransformerService): Promise<void>;
}
