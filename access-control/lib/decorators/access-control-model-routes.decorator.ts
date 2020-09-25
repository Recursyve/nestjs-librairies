import { ACCESS_CONTROL_ROUTES } from "./constant";

/**
 * Defines the routes associated with a model. It helps the AccessControlGuard resolve the right model from the HTTP Request's URL
 * Most times it should be singular a kebab-case singular version of the table name. To make sure, refer to the model's main controller path.
 * ```
 * @Table({ tableName: "accounts" })
 * @AccessControlModelRoutes("account")
 * export class Accounts extends DatabaseEntities<Accounts> {}
 * ```
 */
export function AccessControlModelRoutes(...routes: string[]): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(ACCESS_CONTROL_ROUTES, routes, target);
    };
}
