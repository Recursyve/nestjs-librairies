import { Injectable, Type } from "@nestjs/common";
import { IConfigProvider } from "../providers/config.provider";
import { ModuleRef } from "@nestjs/core";
import { ConfigProviderNotFoundInModuleError } from "../errors/config-provider-not-found-in-module.error";
import { ConfigProviderHandler } from "../handlers/config-provider.handler";
import { ConfigProviderNotRegisteredError } from "../errors/config-provider-not-registered.error";
import { ConfigProviderConfigNotFoundError } from "../errors/config-provider-config-not-found.error";

@Injectable()
export class ConfigProvidersRegistry {
    private registry = new Map<string, IConfigProvider>();

    constructor(private readonly moduleRef: ModuleRef) {
    }

    public registerConfigProviders(providers: Type<IConfigProvider>[]): void {
        for (const provider of providers) {
            const instance = this.moduleRef.get(provider, { strict: false });
            if (!instance) {
                throw new ConfigProviderNotFoundInModuleError(provider);
            }

            const config = ConfigProviderHandler.getConfig(provider);
            if (!config) {
                throw new ConfigProviderConfigNotFoundError(provider);
            }
            this.registry.set(config.type, instance);
        }
    }

    public getConfigProvider(type: string): IConfigProvider {
        const configProvider = this.registry.get(type);
        if (!configProvider) {
            throw new ConfigProviderNotRegisteredError(type);
        }

        return configProvider;
    }
}
