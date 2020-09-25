import { ACCESS_CONTROL_ROUTES } from "./constant";

export function AccessControlRoutes(...routes: string[]): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(ACCESS_CONTROL_ROUTES, routes, target);
    };
}
