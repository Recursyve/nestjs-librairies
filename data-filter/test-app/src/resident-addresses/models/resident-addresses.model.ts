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
import { Locations } from "../../locations/models/locations.model";

@Table({
    tableName: "resident_addresses"
})
export class ResidentAddresses extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly street?: string;

    @Column
    declare public readonly postal_code?: string;

    @Column
    @ForeignKey(() => Locations)
    declare public readonly location_id?: number;

    @BelongsTo(() => Locations)
    declare public readonly location?: Locations;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
