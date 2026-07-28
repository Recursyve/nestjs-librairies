import { AutoIncrement, Column, CreatedAt, DeletedAt, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "catalog_items"
})
export class CatalogItems extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly code?: string;

    @Column
    declare public readonly label?: string;

    @Column
    declare public readonly status?: string;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
