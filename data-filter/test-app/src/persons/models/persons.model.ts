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
import { Coords } from "../../coords/models/coords.model";

@Table({
    tableName: "persons",
    comment: "person"
})
export class Persons extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly user_id?: string;

    @Column
    @ForeignKey(() => Coords)
    declare public readonly coord_id?: number;

    @Column
    declare public readonly email?: string;

    @Column
    declare public readonly first_name?: string;

    @Column
    declare public readonly last_name?: string;

    @BelongsTo(() => Coords)
    declare public readonly coord?: Coords;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
