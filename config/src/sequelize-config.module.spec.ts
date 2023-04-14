import { Variable } from "./decorators/variable.decorator";
import { Test, TestingModule } from "@nestjs/testing";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule } from "./config.module";
import { ConfigUtils } from "./config.utils";
import { SequelizeConfigModule } from "./sequelize-config.module";
import { SequelizeConfig } from "./decorators";

@SequelizeConfig()
class SequelizeConfigTest {
    @Variable
    name: string;
}

describe("SequelizeConfigModule", () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                SequelizeModule.forRoot({
                    dialect: "sqlite",
                    storage: "memory",
                }),
                ConfigModule.forRoot(SequelizeConfigTest),
                SequelizeConfigModule,
            ],
            exports: [SequelizeModule]
        }).compile();
    });

    it("Config should be provided in module", async () => {
        const config = moduleRef.get<SequelizeConfigTest>(ConfigUtils.getProviderToken(SequelizeConfigTest));

        expect(config).toBeDefined();
    });
});
