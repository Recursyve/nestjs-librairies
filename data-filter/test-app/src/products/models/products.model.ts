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
    tableName: "products",
    comment: "product"
})
export class Products extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly sku: string;

    @Column
    declare public readonly name: string;

    @Column
    declare public readonly status?: string;

    @Column
    declare public readonly stock?: number;

    @Column(DataType.JSON)
    declare public readonly metadata?: Record<string, unknown>;

    @Column(DataType.JSON)
    declare public readonly tags?: string[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
