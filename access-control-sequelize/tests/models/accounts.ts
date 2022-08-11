import { AllowNull, AutoIncrement, BelongsToMany, Column, Model, PrimaryKey, Table } from "sequelize-typescript";
import { AccountDevices } from "./account-devices";
import { Devices } from "./devices";

@Table
export class Accounts extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @AllowNull(false)
    @Column
    userId: string;

    @AllowNull(false)
    @Column
    name: string;

    @BelongsToMany(() => Devices, () => AccountDevices)
    devices: Devices[];
}
