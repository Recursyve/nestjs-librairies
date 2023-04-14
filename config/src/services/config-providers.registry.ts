import { Injectable, Type } from "@nestjs/common";
import { IConfigProvider } from "../providers/config.provider";
import { ModuleRef } from "@nestjs/core";
import { ConfigProviderHandler } from "../handlers/config-provider.handler";
import { ConfigProviderNotRegisteredError } from "../errors/config-provider-not-registered.error";
import { ConfigProviderConfigNotFoundError } from "../errors/config-provider-config-not-found.error";
import { ConfigExplorerService } from "./config-explorer.service";
import { ConfigProviderTypeAlreadyRegisteredError } from "../errors/config-provider-type-already-registered.error";

@Injectable()
export class ConfigProvidersRegistry {
    private registry = new Map<string, IConfigProvider>();
    private initialized = false;

    constructor(private readonly moduleRef: ModuleRef, private explorer: ConfigExplorerService) {}

    public registerConfigProviders(providers: IConfigProvider[]): void {
        for (const provider of providers) {
            const providerType = provider.constructor as Type<IConfigProvider>;

            const config = ConfigProviderHandler.getConfig(providerType);
            if (!config) {
                throw new ConfigProviderConfigNotFoundError(providerType);
            }

            if (this.registry.has(config.type)) {
                throw new ConfigProviderTypeAlreadyRegisteredError(config.type, providerType);
            }

            this.registry.set(config.type, provider);
        }
    }

    public getConfigProvider(type: string): IConfigProvider {
        this.initialize();

        const configProvider = this.registry.get(type);
        if (!configProvider) {
            throw new ConfigProviderNotRegisteredError(type);
        }

        return configProvider;
    }

    private initialize(): void {
        if (this.initialized) {
            return;
        }

        const configProviders = this.explorer.exploreConfigProviders();
        this.registerConfigProviders(configProviders);
        this.initialized = true;
    }
}
