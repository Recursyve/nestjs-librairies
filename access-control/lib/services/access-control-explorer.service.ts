import type { Type } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";
import { ModulesContainer } from "@nestjs/core/injector/modules-container";
import { isDefined } from "@recursyve/nice-ts-utils";

import type { IDatabaseAdapter } from "../adapters/database.adapter";
import {
    CREATED_POLICY_METADATA,
    DATABASE_ADAPTER_METADATA,
    DELETED_POLICY_METADATA,
    POLICY_METADATA,
    RESOURCE_ACCESS_UPDATED_METADATA,
    UPDATED_POLICY_METADATA
} from "../decorators/constant";
import type { AccessControlObjects } from "../models/access-control-objects.model";
import type { ResourceId } from "../models/resources.model";
import { AccessPolicy } from "../policies/access.policy";
import { ResourceAccessUpdatedPolicy } from "../policies/resource-access-updated-policy.service";
import { ResourceCreatedPolicy } from "../policies/resource-created-policy.service";
import { ResourceDeletedPolicy } from "../policies/resource-deleted-policy.service";
import { ResourceUpdatedPolicy } from "../policies/resource-updated-policy.service";

@Injectable()
export class AccessControlExplorerService {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    public explore(): AccessControlObjects {
        const modules = [...this.modulesContainer.values()];

        const policies = this.flatMap<AccessPolicy>(modules, (instance) =>
            this.filterProvider(instance, POLICY_METADATA)
        );
        const createdPolicies = this.flatMap<ResourceCreatedPolicy<object>>(modules, (instance) =>
            this.filterProvider(instance, CREATED_POLICY_METADATA)
        );
        const updatedPolicies = this.flatMap<ResourceUpdatedPolicy<object>>(modules, (instance) =>
            this.filterProvider(instance, UPDATED_POLICY_METADATA)
        );
        const deletedPolicies = this.flatMap<ResourceDeletedPolicy<object>>(modules, (instance) =>
            this.filterProvider(instance, DELETED_POLICY_METADATA)
        );
        const accessUpdatedPolicies = this.flatMap<ResourceAccessUpdatedPolicy<ResourceId>>(modules, (instance) =>
            this.filterProvider(instance, RESOURCE_ACCESS_UPDATED_METADATA)
        );
        const databaseAdapters = this.flatMap<IDatabaseAdapter>(modules, (instance) =>
            this.filterProvider(instance, DATABASE_ADAPTER_METADATA)
        );

        return {
            policies,
            createdPolicies,
            updatedPolicies,
            deletedPolicies,
            accessUpdatedPolicies,
            databaseAdapters
        };
    }

    public flatMap<T>(modules: Module[], callback: (instance: InstanceWrapper) => Type | null): Type<T>[] {
        return modules
            .flatMap((module) => [...module.providers.values()].map(callback))
            .filter((element): element is Type<T> => isDefined(element));
    }

    public filterProvider(wrapper: InstanceWrapper, metadataKey: string): Type | null {
        const instance: unknown = wrapper.instance;
        if (typeof instance !== "object" || instance === null) {
            return null;
        }
        return this.extractMetadata(instance, metadataKey);
    }

    public extractMetadata(instance: object, metadataKey: string): Type | null {
        const constructor = Reflect.getPrototypeOf(instance)?.constructor as Type | undefined;
        if (!isDefined(constructor)) {
            return null;
        }

        const metadata: unknown = Reflect.getMetadata(metadataKey, constructor);
        if (!isDefined(metadata)) {
            return null;
        }

        return constructor;
    }
}
