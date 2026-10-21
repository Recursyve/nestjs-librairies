import type { Transaction } from "sequelize";

export type SequelizeConfigUpdate<T extends ManageableSequelizeConfig<T>> = Partial<Omit<T, "reload" | "update">>;

export interface ReloadSequelizeConfigOptions {
    transaction?: Transaction;
}

export interface UpdateSequelizeConfigOptions {
    transaction?: Transaction;
}

export abstract class ManageableSequelizeConfig<T extends ManageableSequelizeConfig<T>> {
    public reload!: (options?: ReloadSequelizeConfigOptions) => Promise<void>;
    public update!: (update: SequelizeConfigUpdate<T>, options?: UpdateSequelizeConfigOptions) => Promise<void>;
}
