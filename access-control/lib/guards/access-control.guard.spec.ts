import type { ModuleRef } from "@nestjs/core";
import type { Reflector } from "@nestjs/core";
import { beforeEach, describe, expect, it } from "vitest";

import { AccessControlModelRoutes } from "../decorators/access-control-model-routes.decorator";
import type { UserDeserializer } from "../deserializers/user.deserializer";
import { AccessActionType } from "../models/access-rules.model";
import type { AccessControlService } from "../services/access-control.service";
import type { DatabaseAdaptersRegistry } from "../services/database-adapters.registry";
import { AccessControlGuard } from "./access-control.guard";

@AccessControlModelRoutes("account")
class ModelTest1 {}

@AccessControlModelRoutes("coord")
class ModelTest2 {}

@AccessControlModelRoutes("test/coord")
class ModelTest3 {}

const readIdAction = [{ type: AccessActionType.Read, resourceIdParameterName: "id" }];
const readAccountAndCoordActions = [
    { type: AccessActionType.Read, resourceIdParameterName: "id" },
    { type: AccessActionType.Read, resourceIdParameterName: "coordId" }
];

describe(AccessControlGuard, () => {
    let guard: AccessControlGuard;

    beforeEach(() => {
        const databaseAdaptersRegistry = {
            getModels: () => [ModelTest1, ModelTest2, ModelTest3]
        } satisfies Pick<DatabaseAdaptersRegistry, "getModels">;

        guard = new AccessControlGuard(
            undefined as unknown as Reflector,
            undefined as unknown as AccessControlService,
            databaseAdaptersRegistry as DatabaseAdaptersRegistry,
            undefined as unknown as UserDeserializer,
            undefined as unknown as ModuleRef
        );

        guard.onModuleInit();
    });

    describe("getModels", () => {
        it("resolves a single-segment account route", () => {
            expect.assertions(1);

            expect(guard.getModels("/account/:id", readIdAction)).toStrictEqual([ModelTest1]);
        });

        it("resolves a single-segment coord route", () => {
            expect.assertions(1);

            expect(guard.getModels("/coord/:id", readIdAction)).toStrictEqual([ModelTest2]);
        });

        it("resolves a multi-segment route registered on one model", () => {
            expect.assertions(1);

            expect(guard.getModels("/test/coord/:id", readIdAction)).toStrictEqual([ModelTest3]);
        });

        it("resolves account and coord models for a nested path", () => {
            expect.assertions(1);

            expect(guard.getModels("/account/:id/coord/:coordId", readAccountAndCoordActions)).toStrictEqual([
                ModelTest1,
                ModelTest2
            ]);
        });

        it("resolves account and test/coord models for a nested path", () => {
            expect.assertions(1);

            expect(guard.getModels("/account/:id/test/coord/:coordId", readAccountAndCoordActions)).toStrictEqual([
                ModelTest1,
                ModelTest3
            ]);
        });
    });
});
