import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { ConfigModule } from "../config.module";
import { InjectConfig } from "./inject-config.decorator";
import { Variable } from "./variable.decorator";

class InjectConfigModel {
    @Variable(false)
    public VALUE!: string;
}

@Injectable()
class ConfigConsumer {
    constructor(@InjectConfig(InjectConfigModel) public readonly config: InjectConfigModel) {}
}

describe(InjectConfig, () => {
    it("injects the config instance registered by ConfigModule", async () => {
        expect.assertions(2);

        process.env["VALUE"] = "injected";

        const moduleRef = await Test.createTestingModule({
            imports: [ConfigModule.forRoot(InjectConfigModel)],
            providers: [ConfigConsumer]
        }).compile();
        await moduleRef.init();

        const consumer = moduleRef.get(ConfigConsumer);

        expect(consumer.config).toMatchObject({ VALUE: "injected" });
        expect(consumer.config).toBeInstanceOf(InjectConfigModel);
    });
});
