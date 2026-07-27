import {
    AutoIncrement,
    BelongsTo,
    BelongsToMany,
    Column,
    CreatedAt,
    DeletedAt,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { Coords } from "../../coords/models/coords.model";
import { Owners } from "../../owners/models/owners.model";
import { PlaceOwners } from "../../place-owners/models/place-owners.model";
import { Systems } from "../../systems/models/systems.model";

@Table({
    tableName: "places",
    comment: "place"
})
export class Places extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Coords)
    declare public readonly billing_coord_id?: number;

    @Column
    @ForeignKey(() => Coords)
    declare public readonly geo_coord_id?: number;

    @BelongsTo(() => Coords, "billing_coord_id")
    declare public readonly billingCoord?: Coords;

    @BelongsTo(() => Coords, "geo_coord_id")
    declare public readonly geoCoord?: Coords;

    @HasMany(() => Systems)
    declare public readonly systems?: Systems[];

    @BelongsToMany(() => Owners, () => PlaceOwners)
    declare public readonly owners?: Owners[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
