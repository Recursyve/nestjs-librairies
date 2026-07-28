import { Logger, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/sequelize";
import { Test } from "@nestjs/testing";
import { DataFilterService } from "@recursyve/nestjs-data-filter";
import { DatabaseError } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { TestHarness } from "./harness/test-harness";

async function initValidateDataApp() {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule]
    })
        .overrideProvider("__VALIDATE_DATA__")
        .useValue(true)
        .compile();

    const sequelize = moduleRef.get<Sequelize>(getConnectionToken());
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.sync({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    return app;
}

describe("validateData startup validation", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("boots successfully when validateData is true and data targets are queryable", async () => {
        const harness = await TestHarness.create({ validateData: true });
        await harness.close();
    });

    it("queries each registered data target with logging disabled during startup validation", async () => {
        const findOne = vi.fn().mockResolvedValue({});
        vi.spyOn(DataFilterService.prototype, "for").mockReturnValue({ findOne } as never);

        const app = await initValidateDataApp();

        expect(findOne).toHaveBeenCalled();
        expect(findOne).toHaveBeenCalledWith({ logging: false });

        await app.close();
    });

    it("logs database errors from data target validation without aborting startup", async () => {
        const findOne = vi.fn().mockRejectedValue(new DatabaseError({ message: "invalid column reference" } as never));
        vi.spyOn(DataFilterService.prototype, "for").mockReturnValue({ findOne } as never);
        const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

        const app = await initValidateDataApp();

        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("invalid column reference"));

        await app.close();
    });

    it("logs non-database errors from data target validation without aborting startup", async () => {
        const findOne = vi.fn().mockRejectedValue(new Error("unexpected validation failure"));
        vi.spyOn(DataFilterService.prototype, "for").mockReturnValue({ findOne } as never);
        const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

        const app = await initValidateDataApp();

        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Error: unexpected validation failure"));

        await app.close();
    });
});
