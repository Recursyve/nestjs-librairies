import { CanActivate, ExecutionContext, Inject, Injectable, Type } from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { DatabaseAdapter } from "../adapters/database.adapter";
import { ACCESS_CONTROL_MODELS } from "../constant";
import { ACCESS_CONTROL_ROUTES, FALLBACK_ACCESS_CONTROL_GUARDS, NEEDS_ACCESS_ACTIONS } from "../decorators/constant";
import { UserDeserializer } from "../deserializers";
import { AccessAction } from "../models";
import { AccessControlService } from "../services";

@Injectable()
export class AccessControlGuard implements CanActivate {
    private resources: { [resource: string]: unknown };
    private routes: string[];

    constructor(
        @Inject(ACCESS_CONTROL_MODELS) private readonly models: any[],
        private readonly reflector: Reflector,
        private readonly accessControlService: AccessControlService,
        private readonly databaseAdapter: DatabaseAdapter,
        private readonly userDeserializer: UserDeserializer,
        private readonly moduleRef: ModuleRef
    ) {
        this.init();
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        return (await this.validateAccessControl(context))
            || await this.fallbackAccessControlGuards(context);
    }

    private async validateAccessControl(context: ExecutionContext): Promise<boolean> {
        const needsAccessActions = this.reflector.get<AccessAction[]>(NEEDS_ACCESS_ACTIONS, context.getHandler());
        if (!needsAccessActions) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        request.resources = this.getModels(request.route.path, needsAccessActions);
        const user = await this.userDeserializer.deserializeUser(request);

        const data: [AccessAction, any][] = needsAccessActions.map<[AccessAction, any]>((x, i) => [
            x,
            request.resources[i]
        ]);

        for (const [accessAction, resource] of data) {
            if (!resource) {
                return false;
            }

            const resourceAccessControlService = this.accessControlService.forModel(resource);
            const accessRulesForUser = await resourceAccessControlService.getAccessRules(
                user,
                request.params[accessAction.resourceIdParameterName]
            );

            if (!accessRulesForUser) {
                return false;
            }

            if (!accessRulesForUser[accessAction.type]) {
                return false;
            }
        }

        return true;
    }

    private async fallbackAccessControlGuards(context: ExecutionContext): Promise<boolean> {
        const guards = this.reflector.get<Type<CanActivate>[]>(FALLBACK_ACCESS_CONTROL_GUARDS, context.getHandler()) ?? [];
        const shouldActivate = await Promise.all(
            guards.map(async guard =>
                (await this.moduleRef.get<CanActivate>(guard, { strict: false }))
                    .canActivate(context))
        );
        return shouldActivate.length && shouldActivate.every(activate => activate);
    }

    public getModels(path: string, actions: AccessAction[]): any[] {
        const model = [];
        for (const action of actions) {
            const param = `/:${action.resourceIdParameterName}`;
            const paramIndex = path.indexOf(param);
            for (const key in this.resources) {
                const index = path.indexOf(key);

                /**
                 * Path always start with / so we check for index 1
                 * We also check if the next value after the path is the param
                 * Ex: /test/coord/:id -> Resource test/coord is accepted, but not resource test or coord
                 */
                if (index === 1 && index + key.length === paramIndex) {
                    model.push(this.resources[key]);
                    path = path.slice(paramIndex + param.length);
                }
            }
        }
        return model;
    }

    private init(): void {
        this.resources = {};
        for (const model of this.models) {
            const routes = this.reflectModelRoutes(model);
            if (!routes) {
                continue;
            }

            for (const route of routes) {
                if (this.resources[route]) {
                    throw new Error(`${route} is already associated to a model (${this.databaseAdapter?.getResourceName(this.resources[route])})`);
                }
                this.resources[route] = model;
            }
        }
        this.routes = Object.keys(this.resources);
    }

    private reflectModelRoutes(policy: any): string[] {
        return Reflect.getMetadata(ACCESS_CONTROL_ROUTES, policy);
    }
}
