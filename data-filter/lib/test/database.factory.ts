import { ModelCtor, Sequelize } from "sequelize-typescript";

let sync = false;
let sequelize: Sequelize;

export async function databaseFactory() {
    if (sync) {
        return sequelize;
    }

    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: ":memory:",
        database: "test_db",
        username: "root",
        password: "",
        define: {
            timestamps: true,
            paranoid: true,
            updatedAt: "updated_at",
            createdAt: "created_at",
            deletedAt: "deleted_at",
            defaultScope: {
                attributes: {
                    exclude: ["updated_at", "created_at", "deleted_at"]
                }
            }
        },
        models: []
    });

    sync = true;
    await sequelize.sync();
    return sequelize;
}
