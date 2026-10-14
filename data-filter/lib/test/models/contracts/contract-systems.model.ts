import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";

import { MaintenanceVisits } from "../maintenance-visits/maintenance-visits.model";
import { Systems } from "../systems/systems.model";
import { Contracts } from "./contracts.model";

@Table({
    tableName: "contract_systems",
    comment: "contract-system"
})
export class ContractSystems extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare id: number;

    @Column
    @ForeignKey(() => Contracts)
    contract_id?: number;

    @Column
    @ForeignKey(() => Systems)
    system_id?: number;

    @Column
    active?: boolean;

    @Column(DataType.DATE)
    activated_date?: string;

    @BelongsTo(() => Contracts)
    contract?: Contracts;

    @BelongsTo(() => Systems)
    system?: Systems;

    @HasMany(() => MaintenanceVisits)
    visits?: MaintenanceVisits[];

    @CreatedAt
    created_at?: Date;

    @UpdatedAt
    updated_at?: Date;

    @DeletedAt
    deleted_at?: Date;
}
