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
import { CountLabParents } from "./count-lab-parents.model";

@Table({
    tableName: "count_lab_children"
})
export class CountLabChildren extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => CountLabParents)
    declare public readonly parent_id?: number;

    @Column
    declare public readonly label?: string;

    @BelongsTo(() => CountLabParents)
    declare public readonly parent?: CountLabParents;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
