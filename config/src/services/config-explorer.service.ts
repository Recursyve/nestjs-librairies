import { Injectable, Type } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core";
import { IConfigProvider } from "../providers/i-config-provider";
import { CONFIG_PROVIDER } from "../constant";

@Injectable()
export class ConfigExplorerService {
    constructor(private readonly modulesContainer: ModulesContainer) {
    }

    private get providers(): any[] {
        return [...this.modulesContainer.values()].flatMap(module => [...module.providers.values()]).map(provider => provider?.instance).filter(provider => !!provider);
    }

    public exploreConfigProviders(): Type<IConfigProvider>[] {
        const modules = [...this.modulesContainer.values()];

        return this.providers.map(provider => provider.constructor).filter(providerType => Reflect.getMetadata(CONFIG_PROVIDER, providerType));
    }
}
