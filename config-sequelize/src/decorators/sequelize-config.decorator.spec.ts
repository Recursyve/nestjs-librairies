import { ConfigHandler, Variable } from "@recursyve/nestjs-config";
import { describe, expect, it } from "vitest";

import { SequelizeConfigProvider } from "../providers/sequelize.config-provider";
import { SequelizeConfig } from "./sequelize-config.decorator";

@SequelizeConfig()
class SequelizeAnnotatedConfig {
    @Variable
    public host!: string;
}

describe(SequelizeConfig, () => {
    it("sets the sequelize provider on the config metadata", () => {
        expect.assertions(1);

        const metadata = ConfigHandler.getConfig(SequelizeAnnotatedConfig);

        expect(metadata.provider).toBe(SequelizeConfigProvider.type);
    });
});
