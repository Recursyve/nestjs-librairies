import { AutoIncrement, Column, CreatedAt, DeletedAt, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "invoices",
    comment: "invoice"
})
export class Invoices extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly invoice_number?: string;

    @Column
    declare public readonly paid?: boolean;

    @Column
    declare public readonly subtotal?: number;

    @Column
    declare public readonly total_cost?: number;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
