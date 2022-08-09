import { AutoIncrement, Column, CreatedAt, DeletedAt, Model, PrimaryKey, UpdatedAt } from "sequelize-typescript";

export class SequelizeEntities extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id: number;

    @CreatedAt
    @Column({ field: "created_at" })
    createdAt: Date;

    @UpdatedAt
    @Column({ field: "updated_at" })
    updatedAt: Date;

    @DeletedAt
    @Column({ field: "deleted_at" })
    deletedAt: Date;
}

/**
 * @deprecated: Use SequelizeEntities instead
 */
export class DatabaseEntities extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id: number;

    @CreatedAt
    @Column({ field: "created_at" })
    createdAt: Date;

    @UpdatedAt
    @Column({ field: "updated_at" })
    updatedAt: Date;

    @DeletedAt
    @Column({ field: "deleted_at" })
    deletedAt: Date;
}
