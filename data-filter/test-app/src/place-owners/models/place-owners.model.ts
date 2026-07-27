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
import { Owners } from "../../owners/models/owners.model";
import { Places } from "../../places/models/places.model";

@Table({
    tableName: "place_owners"
})
export class PlaceOwners extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Places)
    declare public readonly place_id?: number;

    @Column
    @ForeignKey(() => Owners)
    declare public readonly owner_id?: number;

    @BelongsTo(() => Owners)
    declare public readonly owner?: Owners;

    @BelongsTo(() => Places)
    declare public readonly place?: Places;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
