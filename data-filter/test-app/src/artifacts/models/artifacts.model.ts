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
import { Museums } from "../../museums/models/museums.model";

@Table({
    tableName: "artifacts"
})
export class Artifacts extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Museums)
    declare public readonly museum_id?: number;

    @Column
    declare public readonly title?: string;

    @Column
    declare public readonly status?: string;

    @Column
    declare public readonly display_rank?: number;

    @BelongsTo(() => Museums)
    declare public readonly museum?: Museums;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
