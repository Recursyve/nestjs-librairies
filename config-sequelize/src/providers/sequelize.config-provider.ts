import { Injectable } from "@nestjs/common";
import {
    ConfigSequelizeModel,
    InjectConfigSequelizeModel,
    ReloadSequelizeConfigOptions,
    SequelizeConfigManager,
    SequelizeConfigUpdate,
    UpdateSequelizeConfigOptions
} from "../models";
import { ConfigProvider, IConfigProvider } from "@recursyve/nestjs-config";
import { ConfigTransformerService } from "@recursyve/nestjs-config/services/config-transformer.service";
import { Transaction } from "sequelize";

export interface GetSequelizeConfigValueOptions {
    transaction?: Transaction;
}

@Injectable()
@ConfigProvider(SequelizeConfigProvider.type)
export class SequelizeConfigProvider implements IConfigProvider {
    static type = "sequelize" as const;

    private initialized = false;

    constructor(@InjectConfigSequelizeModel() private repository: typeof ConfigSequelizeModel) {}

    public async getValue(key: string, options?: GetSequelizeConfigValueOptions): Promise<string | null> {
        await this.initialize();

        const config = await this.repository.findOne({
            where: { key },
            transaction: options?.transaction
        });
        return config?.getDataValue("value");
    }

    public async hydrate<T extends Object>(
        config: T,
        configTransformerService: ConfigTransformerService
    ): Promise<void> {
        if (!(config instanceof SequelizeConfigManager)) {
            return;
        }

        config.reload = async (options?: ReloadSequelizeConfigOptions) =>
            configTransformerService.reloadConfig<T, GetSequelizeConfigValueOptions>(config, {
                getValue: { transaction: options?.transaction }
            });

        config.update = async (update: SequelizeConfigUpdate<any>, options?: UpdateSequelizeConfigOptions) =>
            this.update(config, update, options);
    }

    private async update<T extends SequelizeConfigManager<T>>(
        config: T,
        update: SequelizeConfigUpdate<T>,
        options?: ReloadSequelizeConfigOptions
    ): Promise<void> {
        // TODO: Perform update, and then call `this.reload`. It may be less efficient, by it will be WAY easier, and it
        // will prevent code duplication.
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
