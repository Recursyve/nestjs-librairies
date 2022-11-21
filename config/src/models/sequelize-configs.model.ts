import { AllowNull, Column, Model, Table } from "sequelize-typescript";

@Table({ tableName: "configs", modelName: "configs" })
export class SequelizeConfigsModel extends Model {
    @AllowNull(false)
    @Column
    public key: string;

    @AllowNull(false)
    @Column
    public value: string;
}
