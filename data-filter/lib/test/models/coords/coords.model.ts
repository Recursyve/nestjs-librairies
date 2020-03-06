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
import { Locations } from "../locations/locations.model";

@Table({
    tableName: "coords"
})
export class Coords extends Model<Coords> {
    @AutoIncrement
    @PrimaryKey
    @Column
    id: number;

    @Column
    @ForeignKey(() => Locations)
    location_id: number;

    @Column
    street_number: number;

    @Column
    address: string;

    @Column
    address_2: string;

    @Column
    postal_code: string;

    @Column
    cellphone: string;

    @Column
    cellphone_ext: string;

    @Column
    house_phone: string;

    @Column
    house_phone_ext: string;

    @Column
    business_phone: string;

    @Column
    business_phone_ext: string;

    @BelongsTo(() => Locations)
    location: Locations;

    @CreatedAt
    created_at: Date;

    @UpdatedAt
    updated_at: Date;

    @DeletedAt
    deleted_at: Date;
}
