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
import { ResidentAddresses } from "../../resident-addresses/models/resident-addresses.model";

@Table({
    tableName: "residents"
})
export class Residents extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    declare public readonly full_name?: string;

    @Column
    declare public readonly email?: string;

    @Column
    @ForeignKey(() => ResidentAddresses)
    declare public readonly address_id?: number;

    @BelongsTo(() => ResidentAddresses)
    declare public readonly address?: ResidentAddresses;

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
