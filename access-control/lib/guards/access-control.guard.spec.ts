import { AccessControlRoutes } from "../decorators/access-control-routes.decorator";
import { AccessControlGuard } from "./access-control.guard";

@AccessControlRoutes("account")
class ModelTest1 {}

@AccessControlRoutes("coord")
class ModelTest2 {}

describe("AccessControlGuard", () => {
    let guard: AccessControlGuard;

    beforeAll(() => {
        guard = new AccessControlGuard([
            ModelTest1 as any,
            ModelTest2 as any
        ], null, null, null);
    });

    it("getModels should return appropriated models", () => {
        const res1 = guard.getModels("/account", 1);
        expect(res1).toBeDefined();
        expect(res1).toHaveLength(1);
        expect(res1[0]).toBe(ModelTest1);

        const res2 = guard.getModels("/coord", 1);
        expect(res2).toBeDefined();
        expect(res2).toHaveLength(1);
        expect(res2[0]).toBe(ModelTest2);

        const res3 = guard.getModels("/account/1/coord/1", 2);
        expect(res3).toBeDefined();
        expect(res3).toHaveLength(2);
        expect(res3[0]).toBe(ModelTest1);
        expect(res3[1]).toBe(ModelTest2);
    });
});
