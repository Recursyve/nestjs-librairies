import { Transaction } from "sequelize";

export type SequelizeConfigUpdate<T extends SequelizeConfigManager<T>> = Omit<T, "reload" | "update">;

export type ReloadSequelizeConfigOptions = {
    transaction?: Transaction;
};

export type UpdateSequelizeConfigOptions = {
    transaction?: Transaction;
};

export abstract class SequelizeConfigManager<T extends SequelizeConfigManager<T>> {
    reload: (options?: ReloadSequelizeConfigOptions) => Promise<void>;
    update: (update: SequelizeConfigUpdate<T>, options?: UpdateSequelizeConfigOptions) => Promise<void>;
}
