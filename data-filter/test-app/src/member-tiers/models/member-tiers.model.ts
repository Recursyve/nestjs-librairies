import { AutoIncrement, Column, CreatedAt, DeletedAt, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "member_tiers"
})
export class MemberTiers extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly tier_code?: string;

    @Column
    declare public readonly label?: string;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
