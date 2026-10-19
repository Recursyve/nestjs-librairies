/* eslint-disable @typescript-eslint/no-deprecated -- DatabaseEntities alias remains public */
import { describe, expect, it } from "vitest";

import { DatabaseEntities, SequelizeEntities } from "./sequelize-entities.model";

describe(SequelizeEntities, () => {
    it("keeps DatabaseEntities as a backward-compatible alias", () => {
        expect.assertions(1);

        expect(DatabaseEntities.prototype).toBeInstanceOf(SequelizeEntities);
    });
});
