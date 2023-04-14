import { Injectable } from "@nestjs/common";
import { IConfigProvider } from "./config.provider";
import { SequelizeConfigsModel } from "../models/sequelize-configs.model";
import { ConfigProvider } from "../decorators/config-provider.decorator";
import { InjectModel } from "@nestjs/sequelize";
import { Sequelize } from "sequelize";
import { ModulesContainer } from "@nestjs/core";

@Injectable()
@ConfigProvider(SequelizeConfigProvider.type)
export class SequelizeConfigProvider implements IConfigProvider {
    static type = "sequelize" as const;

    private configs: SequelizeConfigsModel[] = [];

    private initialized = false;

    constructor(
        @InjectModel(SequelizeConfigsModel) private repository: typeof SequelizeConfigsModel,
        private modulesContainer: ModulesContainer
    ) {}

    public async getValue(key: string): Promise<string | null> {
        await this.initialize();

        const config = this.configs.find((config) => config.key === key);
        return config?.value;
    }

    private async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (!this.repository) {
            throw new Error(
                "Could not retrieve sequelize configs model. Make sure the model has been registered in sequelize."
            );
        }

        const sequelize = [...this.modulesContainer.values()]
            .flatMap((module) => [...module.providers.values()])
            .find((provider) => provider?.instance instanceof Sequelize).instance as Sequelize;

        await sequelize.sync();

        this.configs = await this.repository.findAll();
    }
}
