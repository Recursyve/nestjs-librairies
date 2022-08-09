import { DatabaseEntities } from "@recursyve/nestjs-sequelize-utils";
import { AllowNull, BelongsToMany, Column, Table } from "sequelize-typescript";
import { AccountDevices } from "./account-devices";
import { Devices } from "./devices";

@Table
export class Accounts extends DatabaseEntities {
    @AllowNull(false)
    @Column
    userId: string;

    @AllowNull(false)
    @Column
    name: string;

    @BelongsToMany(() => Devices, () => AccountDevices)
    devices: Devices[];
}
