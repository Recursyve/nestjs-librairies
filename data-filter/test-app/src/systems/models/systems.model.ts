import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    DeletedAt,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import { ContractSystems } from "../../contract-systems/models/contract-systems.model";
import { Places } from "../../places/models/places.model";

@Table({
    tableName: "systems",
    comment: "system"
})
export class Systems extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    declare public readonly id: number;

    @Column
    @ForeignKey(() => Places)
    declare public readonly place_id?: number;

    @Column
    declare public readonly latitude?: number;

    @Column
    declare public readonly longitude?: number;

    @Column
    declare public readonly file_number?: string;

    @BelongsTo(() => Places)
    declare public readonly place?: Places;

    @HasMany(() => ContractSystems)
    declare public readonly contracts?: ContractSystems[];

    @CreatedAt
    declare public readonly created_at?: Date;

    @UpdatedAt
    declare public readonly updated_at?: Date;

    @DeletedAt
    declare public readonly deleted_at?: Date;
}
