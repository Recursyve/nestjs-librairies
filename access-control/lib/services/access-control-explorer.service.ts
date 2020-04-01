import { Injectable, Type } from "@nestjs/common";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";
import { ModulesContainer } from "@nestjs/core/injector/modules-container";
import { CREATED_POLICY_METADATA, POLICY_METADATA, UPDATED_POLICY_METADATA } from "../decorators/constant";
import { AccessControlObjects } from "../models";
import { AccessPolicy, ResourceCreatedPolicy, ResourceUpdatedPolicy } from "../policies";

@Injectable()
export class AccessControlExplorerService {
    constructor(private readonly modulesContainer: ModulesContainer) {}

    public explore(): AccessControlObjects {
        const modules = [...this.modulesContainer.values()];

        const policies = this.flatMap<AccessPolicy>(modules, instance =>
            this.filterProvider(instance, POLICY_METADATA)
        );
        const createdPolicies = this.flatMap<ResourceCreatedPolicy<any>>(modules, instance =>
            this.filterProvider(instance, CREATED_POLICY_METADATA)
        );
        const updatedPolicies = this.flatMap<ResourceUpdatedPolicy<any>>(modules, instance =>
            this.filterProvider(instance, UPDATED_POLICY_METADATA)
        );

        return {
            policies,
            createdPolicies,
            updatedPolicies
        };
    }

    public flatMap<T>(modules: Module[], callback: (instance: InstanceWrapper) => Type<any> | undefined): Type<T>[] {
        const items = modules
            .map(module => [...module.providers.values()].map(callback))
            .reduce((a, b) => a.concat(b), []);
        return items.filter(element => !!element) as Type<T>[];
    }

    public filterProvider(wrapper: InstanceWrapper, metadataKey: string): Type<any> | undefined {
        const { instance } = wrapper;
        if (!instance) {
            return undefined;
        }
        return this.extractMetadata(instance, metadataKey);
    }

    public extractMetadata(instance: Object, metadataKey: string): Type<any> {
        if (!instance.constructor) {
            return;
        }
        const metadata = Reflect.getMetadata(metadataKey, instance.constructor);
        return metadata ? (instance.constructor as Type<any>) : undefined;
    }
}
