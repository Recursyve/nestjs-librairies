import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { Locations } from "../../locations/models/locations.model";

export interface GeoPoint {
    type: "Point";
    coordinates: number[];
}

@Table({
    tableName: "coords"
})
export class Coords extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Locations)
    declare public readonly location_id?: number;

    @Column
    declare public readonly street_number?: number;

    @Column
    declare public readonly address?: string;

    @Column
    declare public readonly address_2?: string;

    @Column
    declare public readonly postal_code?: string;

    @Column
    declare public readonly cellphone?: string;

    @Column
    declare public readonly cellphone_ext?: string;

    @Column
    declare public readonly house_phone?: string;

    @Column
    declare public readonly house_phone_ext?: string;

    @Column
    declare public readonly business_phone?: string;

    @Column
    declare public readonly business_phone_ext?: string;

    @Column({ type: DataType.GEOMETRY("POINT") })
    declare public readonly geo_point?: GeoPoint;

    @BelongsTo(() => Locations)
    declare public readonly location?: Locations;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
