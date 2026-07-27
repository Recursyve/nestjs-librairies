import {
    AutoIncrement,
    BelongsTo,
    BelongsToMany,
    Column,
    CreatedAt,
    DeletedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { Persons } from "../../persons/models/persons.model";
import { PlaceOwners } from "../../place-owners/models/place-owners.model";
import { Places } from "../../places/models/places.model";

@Table({
    tableName: "owners",
    comment: "owner"
})
export class Owners extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Persons)
    declare public readonly person_id?: number;

    @BelongsTo(() => Persons)
    declare public readonly person?: Persons;

    @BelongsToMany(() => Places, () => PlaceOwners)
    declare public readonly places?: Places[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
