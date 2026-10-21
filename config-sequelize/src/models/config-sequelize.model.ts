import { Inject } from "@nestjs/common";
import { DataTypes } from "sequelize";
import { AllowNull, Column, Model, Table } from "sequelize-typescript";

// Based on https://github.com/nestjs/sequelize/blob/f07f502b26e71c54fbb85d6b8d3cdb3424f905ad/lib/common/sequelize.utils.ts#L18
export const ConfigSequelizeModelInjectionToken = "_ConfigSequelizeModelRepository";

export const InjectConfigSequelizeModel = (): ParameterDecorator & PropertyDecorator =>
    Inject(ConfigSequelizeModelInjectionToken);

@Table
export class ConfigSequelizeModel extends Model {
    @AllowNull(false)
    @Column
    public key!: string;

    @AllowNull(false)
    @Column(DataTypes.TEXT)
    public value!: string;
}

export const createSequelizeModel = (tableName?: string): typeof Model => {
    @Table({
        tableName: tableName ?? "configs",
        underscored: true,
        timestamps: true
    })
    class _ConfigSequelizeModel extends ConfigSequelizeModel {}

    return _ConfigSequelizeModel;
};
