import { AutoIncrement, Column, CreatedAt, DeletedAt, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "harbor_notices"
})
export class HarborNotices extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly headline?: string;

    @Column
    declare public readonly priority?: number;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
