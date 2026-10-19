import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { AccessControlModelRoutes } from "./access-control-model-routes.decorator";
import { ACCESS_CONTROL_ROUTES } from "./constant";

@AccessControlModelRoutes("account", "accounts/:id")
class RoutedModel {}

describe(AccessControlModelRoutes, () => {
    it("stores route patterns on the decorated class", () => {
        expect.assertions(1);

        expect(Reflect.getMetadata(ACCESS_CONTROL_ROUTES, RoutedModel)).toStrictEqual(["account", "accounts/:id"]);
    });
});
