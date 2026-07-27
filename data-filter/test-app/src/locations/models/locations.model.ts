import {
    AutoIncrement,
    Column,
    CreatedAt,
    DeletedAt,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { Coords } from "../../coords/models/coords.model";

@Table({
    tableName: "locations",
    comment: "location"
})
export class Locations extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly value?: string;

    @Column
    declare public readonly unique_code?: string;

    @HasMany(() => Coords)
    declare public readonly coords?: Coords[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
