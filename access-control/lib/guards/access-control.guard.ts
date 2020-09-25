import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { ACCESS_CONTROL_MODELS } from "../constant";
import { ACCESS_CONTROL_ROUTES, NEEDS_ACCESS_ACTIONS } from "../decorators/constant";
import { UserDeserializer } from "../deserializers";
import { AccessAction } from "../models";
import { AccessControlService } from "../services";
import { M } from "../utils";

@Injectable()
export class AccessControlGuard implements CanActivate {
    private resources: { [resource: string]: typeof Model };
    private routes: string[];

    constructor(
        @Inject(ACCESS_CONTROL_MODELS) private readonly models: (typeof M)[],
        private readonly reflector: Reflector,
        private readonly accessControlService: AccessControlService,
        private readonly userDeserializer: UserDeserializer
    ) {
        this.init();
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const needsAccessActions = this.reflector.get<AccessAction[]>(NEEDS_ACCESS_ACTIONS, context.getHandler());
        if (!needsAccessActions) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        request.resources = this.getModels(request.route.path, needsAccessActions.length);
        const user = await this.userDeserializer.deserializeUser(request);

        const data: [AccessAction, typeof Model][] = needsAccessActions.map<[AccessAction, typeof Model]>((x, i) => [
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

    // Extracts the models from the route path. Assumes that the schema of the path is:
    // 0/1     /2   /3     /4
    //  /model1/:id1/model2/:id2...
    // Its splits by "/" and takes uneven indexes (1, 3, ...) up until extractCount resources.
    public getModels(path: string, extractCount): typeof Model[] {
        const resources = path
            .split("/")
            .filter((component, index) => component.length && index % 2 !== 0 && index < extractCount * 2 + 1);

        return resources.map(resource => this.resources[resource]);
    }

    private init(): void {
        this.resources = {};
        for (const model of this.models) {
            const routes = this.reflectModelRoutes(model);
            if (!routes) {
                return;
            }

            for (const route of routes) {
                if (this.resources[route]) {
                    throw new Error(`${route} is already associated to a model (${this.resources[route].tableName})`);
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
