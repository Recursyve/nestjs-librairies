import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { Invoices } from "../../invoices/models/invoices.model";

@Table({
    tableName: "contracts",
    comment: "contract"
})
export class Contracts extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column(DataType.DATEONLY)
    declare public readonly start_date?: Date;

    @Column(DataType.DATEONLY)
    declare public readonly end_date?: Date;

    @Column
    declare public readonly total_cost?: number;

    @Column(DataType.DATEONLY)
    declare public readonly payable_by?: Date;

    @Column
    @ForeignKey(() => Invoices)
    declare public readonly invoice_id?: number;

    @BelongsTo(() => Invoices)
    declare public readonly invoice?: Invoices;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
