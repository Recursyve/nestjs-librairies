import { Injectable } from "@nestjs/common";
import { ConfigProvider } from "./config-provider";
import { Sequelize } from "sequelize";

@Injectable()
export class SequelizeConstantsConfigProvider implements ConfigProvider {
    private repository = this.sequelize.model("configs");

    constructor(private sequelize: Sequelize) {}

    public async getValue(key: string): Promise<string> {
        if (!this.repository) {
            throw new Error("Could not retrieve sequelize configs model. Make sure the model has been registered in sequelize.");
        }

        const config = await this.repository.findOne({ where: { key } });
        return config?.getDataValue("value");
    }
}
