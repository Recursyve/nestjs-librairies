import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DeletedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { ContractSystems } from "../../contract-systems/models/contract-systems.model";
import { Visits } from "../../visits/models/visits.model";

@Table({
    tableName: "maintenance_visits",
    comment: "maintenance-visit"
})
export class MaintenanceVisits extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Visits)
    declare public readonly visit_id?: number;

    @Column
    @ForeignKey(() => ContractSystems)
    declare public readonly contract_system_id?: number;

    @BelongsTo(() => Visits)
    declare public readonly visit?: Visits;

    @BelongsTo(() => ContractSystems)
    declare public readonly contractSystem?: ContractSystems;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
