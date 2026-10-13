import type { CreationOptional } from "sequelize";
import { DataTypes } from "sequelize";
import { AutoIncrement, Column, CreatedAt, DeletedAt, Model, PrimaryKey, UpdatedAt } from "sequelize-typescript";

export interface SequelizeEntitiesAttributes {
    id: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class SequelizeEntities<
    TModelAttributes extends {} = any,
    TCreationAttributes extends {} = TModelAttributes
> extends Model<TModelAttributes, TCreationAttributes> {
    @AutoIncrement
    @PrimaryKey
    @Column(DataTypes.INTEGER)
    declare public readonly id: CreationOptional<number>;

    @CreatedAt
    @Column({ field: "created_at" })
    declare public readonly createdAt?: Date;

    @UpdatedAt
    @Column({ field: "updated_at" })
    declare public readonly updatedAt?: Date;

    @DeletedAt
    @Column({ field: "deleted_at" })
    declare public readonly deletedAt?: Date;
}

/**
 * @deprecated: Use SequelizeEntities instead
 */
export class DatabaseEntities extends SequelizeEntities {}
