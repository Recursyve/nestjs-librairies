import { Injectable } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core";
import { IConfigProvider } from "../providers/i-config-provider";

@Injectable()
export class ConfigExplorerService {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    public exploreConfigProviders(): IConfigProvider[] {
        const modules = [...this.modulesContainer.values()];

        return modules.map(module => [...module.providers].map)
    }
}
