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
import { Contracts } from "../../contracts/models/contracts.model";
import { MaintenanceVisits } from "../../maintenance-visits/models/maintenance-visits.model";
import { Systems } from "../../systems/models/systems.model";

@Table({
    tableName: "contract_systems",
    comment: "contract-system"
})
export class ContractSystems extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Contracts)
    declare public readonly contract_id?: number;

    @Column
    @ForeignKey(() => Systems)
    declare public readonly system_id?: number;

    @Column
    declare public readonly active?: boolean;

    @Column(DataType.DATE)
    declare public readonly activated_date?: string;

    @BelongsTo(() => Contracts)
    declare public readonly contract?: Contracts;

    @BelongsTo(() => Systems)
    declare public readonly system?: Systems;

    @HasMany(() => MaintenanceVisits)
    declare public readonly visits?: MaintenanceVisits[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
