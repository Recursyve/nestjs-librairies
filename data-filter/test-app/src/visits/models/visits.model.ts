import {
    AutoIncrement,
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    HasOne,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { MaintenanceVisits } from "../../maintenance-visits/models/maintenance-visits.model";

@Table({
    tableName: "visits",
    comment: "visit"
})
export class Visits extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly type?: string;

    @Column(DataType.DATEONLY)
    declare public readonly visit_date?: string;

    @Column(DataType.TIME)
    declare public readonly visit_time?: string;

    @HasOne(() => MaintenanceVisits)
    declare public readonly maintenanceVisit?: MaintenanceVisits;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
