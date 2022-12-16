import { Injectable, OnModuleInit } from "@nestjs/common";
import { IConfigProvider } from "./config.provider";
import { Sequelize } from "sequelize";
import { SequelizeConfigsModel } from "../models/sequelize-configs.model";
import { ConfigProvider } from "../decorators";

@Injectable()
@ConfigProvider("sequelize")
export class SequelizeConfigProvider implements IConfigProvider, OnModuleInit {
    private repository = this.sequelize.model("configs") as typeof SequelizeConfigsModel;
    private configs: SequelizeConfigsModel[] = [];

    constructor(private sequelize: Sequelize) {}

    public async onModuleInit(): Promise<void> {
        if (!this.repository) {
            throw new Error("Could not retrieve sequelize configs model. Make sure the model has been registered in sequelize.");
        }

        await this.repository.sync();

        this.configs = await this.repository.findAll();
    }

    public async getValue(key: string): Promise<string | null> {
        const config = this.configs.find(config => config.key === key);
        return config?.value;
    }
}
