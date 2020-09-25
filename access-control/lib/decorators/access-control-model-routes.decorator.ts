import { ACCESS_CONTROL_ROUTES } from "./constant";

/**
 * Define the routes associated with a model. It helps the AccessControlGuard to resolve the right model from the HTTP Request
 * ```
 * @Table({ tableName: "accounts" })
 * @AccessControlModelRoutes("account")
 * class Accounts extends DatabaseEntities<Accounts> {}
 * ```
 */
export function AccessControlModelRoutes(...routes: string[]): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(ACCESS_CONTROL_ROUTES, routes, target);
    };
}
