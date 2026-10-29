import type { Type } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { ConfigTransformerService } from "@recursyve/nestjs-config";
import type { IConfigProvider } from "@recursyve/nestjs-config";
import { ConfigHandler, ConfigProvider } from "@recursyve/nestjs-config";
import { isNotEmpty } from "@recursyve/nice-ts-utils";
import { Transaction } from "sequelize";

import { InjectConfigSequelizeModel, ConfigSequelizeModel } from "../models/config-sequelize.model";
import { ManageableSequelizeConfig } from "../models/manageable-sequelize-config.model";
import type {
    ReloadSequelizeConfigOptions,
    SequelizeConfigUpdate,
    UpdateSequelizeConfigOptions
} from "../models/manageable-sequelize-config.model";

export interface GetSequelizeConfigValueOptions {
    transaction?: Transaction;
}

@Injectable()
@ConfigProvider(SequelizeConfigProvider.type)
export class SequelizeConfigProvider implements IConfigProvider {
    public static type = "sequelize" as const;

    private initialized = false;

    constructor(
        @InjectConfigSequelizeModel() private readonly repository: typeof ConfigSequelizeModel,
        private readonly configTransformerService: ConfigTransformerService
    ) {}

    public async getValue(key: string, options?: GetSequelizeConfigValueOptions): Promise<string | null> {
        await this.initialize();

        const config = await this.repository.findOne({
            where: { key },
            transaction: options?.transaction
        });

        const value = config?.getDataValue("value") as string | undefined;
        return value ?? null;
    }

    public async hydrate(config: object): Promise<void> {
        if (!(config instanceof ManageableSequelizeConfig)) {
            return;
        }

        config.reload = async (options?: ReloadSequelizeConfigOptions) => {
            await this.configTransformerService.reloadConfig(config, {
                getValue: { transaction: options?.transaction }
            });
        };

        config.update = async (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- concrete config subclasses are only known at runtime
            update: SequelizeConfigUpdate<any>,
            options?: UpdateSequelizeConfigOptions
        ) => {
            await this.update(config, update, options);
        };

        await Promise.resolve();
    }

    private async update<T extends ManageableSequelizeConfig<T>>(
        config: T,
        update: SequelizeConfigUpdate<T>,
        options?: ReloadSequelizeConfigOptions
    ): Promise<void> {
        const configType = config.constructor as Type<T>;
        const configMetadata = ConfigHandler.getConfig(configType);

        const transactionCallback = async <R>(
            callback: (transaction: Transaction) => Promise<R>
        ): Promise<R | undefined> => {
            if (options?.transaction) {
                return callback(options.transaction);
            }

            return this.repository.sequelize?.transaction(callback);
        };

        await transactionCallback(async (transaction) => {
            // TODO: When updating to sequelize v7, we should use `transaction.afterRollback` in order to revert changes
            // made to the config (we will need to temporarily store a copy of the config before the update).
            // We could do it right now with a `NiceTransaction`, but it is probably not worth it to bring the
            // dependency in.

            await Promise.all(
                Object.entries(update)
                    .filter(([key]) => Object.hasOwn(config, key))
                    .map(([key, value]) => {
                        const variable = configMetadata.variables.find((entry) => entry.propertyKey === key);

                        return {
                            key: variable?.variableName ?? variable?.propertyKey,
                            value: value?.toString()
                        };
                    })
                    .filter(({ key }) => isNotEmpty(key))
                    .map(async ({ key, value }) => {
                        const constant = await this.repository.findOne({ where: { key }, transaction });
                        if (constant) {
                            return this.repository.update(
                                { value },
                                {
                                    where: { key },
                                    transaction
                                }
                            );
                        }

                        return this.repository.create({ key, value }, { transaction });
                    })
            );

            const mutableConfig = config as Record<string, unknown>;
            const mutableUpdate = update as Record<string, unknown>;

            for (const key in update) {
                if (!Object.hasOwn(update, key)) {
                    continue;
                }

                mutableConfig[key] = mutableUpdate[key];
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
