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
import { Warehouses } from "../../warehouses/models/warehouses.model";

@Table({
    tableName: "stock_lines"
})
export class StockLines extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Warehouses)
    declare public readonly warehouse_id?: number;

    @Column
    declare public readonly sku?: string;

    @Column
    declare public readonly quantity?: number;

    @BelongsTo(() => Warehouses)
    declare public readonly warehouse?: Warehouses;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
