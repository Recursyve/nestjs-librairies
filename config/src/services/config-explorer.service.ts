import { Injectable } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core";
import { IConfigProvider } from "../providers/config.provider";
import { ConfigProviderHandler } from "../handlers/config-provider.handler";

@Injectable()
export class ConfigExplorerService {
    private get providers(): any[] {
        return [...this.modulesContainer.values()]
            .flatMap((module) => [...module.providers.values()])
            .map((provider) => provider?.instance)
            .filter((provider) => !!provider);
    }

    constructor(private readonly modulesContainer: ModulesContainer) {}

    public exploreConfigProviders(): IConfigProvider[] {
        return this.providers.filter((providerType) => ConfigProviderHandler.getConfig(providerType.constructor)?.type);
    }
}
