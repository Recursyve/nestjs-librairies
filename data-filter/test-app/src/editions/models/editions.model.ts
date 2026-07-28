import {
    AutoIncrement,
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";

@Table({
    tableName: "editions"
})
export class Editions extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly code?: string;

    @Column
    declare public readonly title?: string;

    @Column
    declare public readonly status?: string;

    @Column(DataType.JSON)
    declare public readonly metadata?: Record<string, unknown>;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
