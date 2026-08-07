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
import { StockLines } from "../../stock-lines/models/stock-lines.model";

@Table({
    tableName: "warehouses"
})
export class Warehouses extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly code?: string;

    @HasMany(() => StockLines)
    declare public readonly lines?: StockLines[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
