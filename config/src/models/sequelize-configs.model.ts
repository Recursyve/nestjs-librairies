import { AllowNull, Column, DataType, Model, Table, Unique } from "sequelize-typescript";

@Table({ tableName: "configs", modelName: "configs" })
export class SequelizeConfigsModel extends Model {
    @AllowNull(false)
    @Unique
    @Column
    public key: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    public value: string;
}
