import { Injectable } from "@nestjs/common";
import { ConfigSequelizeModel, InjectConfigSequelizeModel } from "../models";
import { IConfigProvider } from "@recursyve/nestjs-config/providers";
import { ConfigProvider } from "@recursyve/nestjs-config";

@Injectable()
@ConfigProvider(SequelizeConfigProvider.type)
export class SequelizeConfigProvider implements IConfigProvider {
    static type = "sequelize" as const;

    private initialized = false;

    constructor(@InjectConfigSequelizeModel() private repository: typeof ConfigSequelizeModel) {}

    public async getValue(key: string): Promise<string | null> {
        await this.initialize();

        const config = await this.repository.findOne({ where: { key } });
        return config?.getDataValue("value");
    }

    private async initialize(): Promise<void> {
        // Since configs are resolved during the dependency injection phase, we need to do the initialization before we can run code using `onModuleInit`.
        if (this.initialized) {
            return;
        }

        await this.repository.sync();
        this.initialized = true;
    }
}
