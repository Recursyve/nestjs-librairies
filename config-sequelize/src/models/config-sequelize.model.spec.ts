import { Sequelize } from "sequelize-typescript";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ConfigSequelizeModel } from "./config-sequelize.model";
import { createSequelizeModel } from "./config-sequelize.model";

describe(createSequelizeModel, () => {
    let sequelize: Sequelize;

    beforeEach(() => {
        sequelize = new Sequelize({
            dialect: "sqlite",
            storage: ":memory:",
            logging: false
        });
    });

    afterEach(async () => {
        await sequelize.close();
    });

    it("uses the default configs table name", async () => {
        expect.assertions(1);

        const Model = createSequelizeModel();
        sequelize.addModels([Model as typeof ConfigSequelizeModel]);
        await sequelize.sync();

        expect(Model.tableName).toBe("configs");
    });

    it("uses a custom table name when provided", async () => {
        expect.assertions(1);

        const Model = createSequelizeModel("application_settings");
        sequelize.addModels([Model as typeof ConfigSequelizeModel]);
        await sequelize.sync();

        expect(Model.tableName).toBe("application_settings");
    });
});
