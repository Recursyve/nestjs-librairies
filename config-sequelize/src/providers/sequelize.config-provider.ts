import { Injectable, Type } from "@nestjs/common";
import {
    ConfigSequelizeModel,
    InjectConfigSequelizeModel,
    ManageableSequelizeConfig,
    ReloadSequelizeConfigOptions,
    SequelizeConfigUpdate,
    UpdateSequelizeConfigOptions
} from "../models";
import { ConfigProvider, IConfigProvider } from "@recursyve/nestjs-config";
import { ConfigTransformerService } from "@recursyve/nestjs-config/services/config-transformer.service";
import { Transaction } from "sequelize";
import { ConfigHandler } from "@recursyve/nestjs-config/handlers/config.handler";

export interface GetSequelizeConfigValueOptions {
    transaction?: Transaction;
}

@Injectable()
@ConfigProvider(SequelizeConfigProvider.type)
export class SequelizeConfigProvider implements IConfigProvider {
    static type = "sequelize" as const;

    private initialized = false;

    constructor(
        @InjectConfigSequelizeModel() private repository: typeof ConfigSequelizeModel,
        private configTransformerService: ConfigTransformerService
    ) {}

    public async getValue(key: string, options?: GetSequelizeConfigValueOptions): Promise<string | null> {
        await this.initialize();

        const config = await this.repository.findOne({
            where: { key },
            transaction: options?.transaction
        });
        return config?.getDataValue("value");
    }

    public async hydrate<T extends Object>(config: T): Promise<void> {
        if (!(config instanceof ManageableSequelizeConfig)) {
            return;
        }

        config.reload = async (options?: ReloadSequelizeConfigOptions) =>
            this.configTransformerService.reloadConfig<T, GetSequelizeConfigValueOptions>(config, {
                getValue: { transaction: options?.transaction }
            });

        config.update = async (update: SequelizeConfigUpdate<any>, options?: UpdateSequelizeConfigOptions) =>
            this.update(config, update, options);
    }

    private async update<T extends ManageableSequelizeConfig<T>>(
        config: T,
        update: SequelizeConfigUpdate<T>,
        options?: ReloadSequelizeConfigOptions
    ): Promise<void> {
        const configType = config.constructor as Type<T>;
        const configMetadata = ConfigHandler.getConfig(configType);

        const transactionCallback = <R>(callback: (transaction: Transaction) => Promise<R>) => {
            if (options?.transaction) {
                return callback(options.transaction);
            }

            return this.repository.sequelize.transaction(callback);
        };

        await transactionCallback(async (transaction) => {
            // TODO: When updating to sequelize v7, we should use `transaction.afterRollback` in order to revert changes
            // made to the config (we will need to temporarily store a copy of the config before the update).
            // We could do it right now with a `NiceTransaction`, but it is probably not worth it to bring the
            // dependency in.

            await Promise.all(
                Object.entries(update)
                    .filter(([key, _]) => config.hasOwnProperty(key))
                    .map(([key, value]) => {
                        const variable = configMetadata.variables.find((variable) => variable.propertyKey === key);

                        return {
                            key: variable?.variableName || variable?.propertyKey,
                            value: value.toString()
                        };
                    })
                    .filter(({ key }) => key)
                    .map(({ key, value }) =>
                        this.repository.update(
                            { value },
                            {
                                where: { key },
                                transaction
                            }
                        )
                    )
            );

            for (const key in update) {
                if (!update.hasOwnProperty(key)) {
                    continue;
                }

                config[key] = update[key];
            }
        });
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
