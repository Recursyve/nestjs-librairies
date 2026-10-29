import type { CanActivate, ExecutionContext, OnModuleInit, Type } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { isDefined } from "@recursyve/nice-ts-utils";

import type { AccessControlModel } from "../adapters/database.adapter";
import {
    ACCESS_CONTROL_RESOURCE,
    ACCESS_CONTROL_ROUTES,
    FALLBACK_ACCESS_CONTROL_GUARDS,
    NEEDS_ACCESS_ACTIONS
} from "../decorators/constant";
import { UserDeserializer } from "../deserializers/user.deserializer";
import type { AccessControlResourceConfig } from "../models/access-control-resource.model";
import type { AccessAction } from "../models/access-rules.model";
import { AccessControlService } from "../services/access-control.service";
import { DatabaseAdaptersRegistry } from "../services/database-adapters.registry";
import type { AccessControlHttpRequest } from "../types/access-control-http.types";

@Injectable()
export class AccessControlGuard implements CanActivate, OnModuleInit {
    private resources!: Record<string, AccessControlModel>;
    private routes!: string[];

    constructor(
        private readonly reflector: Reflector,
        private readonly accessControlService: AccessControlService,
        private readonly databaseAdaptersRegistry: DatabaseAdaptersRegistry,
        private readonly userDeserializer: UserDeserializer,
        private readonly moduleRef: ModuleRef
    ) {}

    public onModuleInit(): void {
        this.init();
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        return (await this.validateAccessControl(context)) || (await this.fallbackAccessControlGuards(context));
    }

    private async validateAccessControl(context: ExecutionContext): Promise<boolean> {
        const needsAccessActions = this.reflector.get<AccessAction[] | undefined>(
            NEEDS_ACCESS_ACTIONS,
            context.getHandler()
        );
        if (!isDefined(needsAccessActions)) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AccessControlHttpRequest>();
        const user = await this.userDeserializer.deserializeUser(request);
        if (!isDefined(user)) {
            return false;
        }

        const controllerResource = this.reflector.get<AccessControlResourceConfig | undefined>(
            ACCESS_CONTROL_RESOURCE,
            context.getClass()
        );
        const methodResource = this.reflector.get<AccessControlResourceConfig | undefined>(
            ACCESS_CONTROL_RESOURCE,
            context.getHandler()
        );
        if (!isDefined(controllerResource) && !isDefined(methodResource)) {
            request.resources = this.getModels(request.route.path, needsAccessActions);
        }

        const getResource = (action: AccessAction, index: number): [AccessControlModel, string | undefined] | null => {
            if (!isDefined(controllerResource) && !isDefined(methodResource)) {
                const resource = request.resources?.[index];
                return isDefined(resource) ? [resource, undefined] : null;
            }

            if (controllerResource?.paramId === action.resourceIdParameterName) {
                return [controllerResource.model, controllerResource.type];
            }

            if (methodResource?.paramId === action.resourceIdParameterName) {
                return [methodResource.model, methodResource.type];
            }

            return null;
        };

        const data = needsAccessActions.map((action, index) => ({
            action,
            resourceInfo: getResource(action, index)
        }));

        for (const { action, resourceInfo } of data) {
            if (!isDefined(resourceInfo)) {
                return false;
            }

            const [resource, resourceType] = resourceInfo;
            const resourceAccessControlService = this.accessControlService.forModel(resource, resourceType);
            const resourceId = request.params[action.resourceIdParameterName];
            if (!isDefined(resourceId)) {
                return false;
            }

            const accessRulesForUser = await resourceAccessControlService.getAccessRules(user, resourceId);
            if (!accessRulesForUser[action.type]) {
                return false;
            }
        }

        return true;
    }

    private async fallbackAccessControlGuards(context: ExecutionContext): Promise<boolean> {
        const guards = this.reflector.get<Type<CanActivate>[] | undefined>(
            FALLBACK_ACCESS_CONTROL_GUARDS,
            context.getHandler()
        );
        const shouldActivate = await Promise.all(
            (guards ?? []).map(async (guard) =>
                this.moduleRef.get<CanActivate>(guard, { strict: false }).canActivate(context)
            )
        );
        return shouldActivate.length > 0 && shouldActivate.every((activate) => activate === true);
    }

    public getModels(path: string, actions: AccessAction[]): AccessControlModel[] {
        const model: AccessControlModel[] = [];
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
                    const matchedModel = this.resources[key];
                    if (!isDefined(matchedModel)) {
                        continue;
                    }

                    model.push(matchedModel);
                    path = path.slice(paramIndex + param.length);
                }
            }
        }
        return model;
    }

    private init(): void {
        this.resources = {};
        const models = this.databaseAdaptersRegistry.getModels();
        for (const model of models) {
            const routes = this.reflectModelRoutes(model);
            if (!isDefined(routes)) {
                continue;
            }

            for (const route of routes) {
                if (this.resources[route]) {
                    throw new Error(`${route} is already associated to a model`);
                }
                this.resources[route] = model;
            }
        }
        this.routes = Object.keys(this.resources);
    }

    private reflectModelRoutes(policy: AccessControlModel): string[] | undefined {
        return Reflect.getMetadata(ACCESS_CONTROL_ROUTES, policy) as string[] | undefined;
    }
}
