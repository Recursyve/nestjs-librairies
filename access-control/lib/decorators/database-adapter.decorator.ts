import { DatabaseAdapterConfig } from "../models/database-adapter-config.model";
import { DATABASE_ADAPTER_METADATA } from "./constant";

export function DatabaseAdapter(options: DatabaseAdapterConfig): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(DATABASE_ADAPTER_METADATA, options, target);
    };
}
