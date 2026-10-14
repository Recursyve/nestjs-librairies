import { AllowNull, AutoIncrement, Column, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table
export class Devices extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare public readonly id: number;

    @AllowNull(false)
    @Column
    uniqueId?: string;

    @AllowNull(false)
    @Column
    name?: string;
}
