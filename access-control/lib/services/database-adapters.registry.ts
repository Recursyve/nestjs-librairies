import type { Type } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { isDefined, isNotEmpty } from "@recursyve/nice-ts-utils";

import type { AccessControlModel, IDatabaseAdapter } from "../adapters/database.adapter";
import { DATABASE_ADAPTER_METADATA } from "../decorators/constant";
import type { DatabaseAdapterConfig } from "../models/database-adapter-config.model";

@Injectable()
export class DatabaseAdaptersRegistry {
    private readonly registry: Map<string, IDatabaseAdapter> = new Map<string, IDatabaseAdapter>();

    constructor(private readonly moduleRef: ModuleRef) {}

    public registerAdapters(...adapters: Type<IDatabaseAdapter>[]): void {
        adapters.forEach((policy) => {
            this.registerAdapter(policy);
        });
    }

    private registerAdapter(adapter: Type<IDatabaseAdapter>): void {
        const instance = this.moduleRef.get(adapter, { strict: false });
        if (!isDefined(instance)) {
            return;
        }

        const config = this.reflectModel(adapter);
        this.registry.set(config.type, instance);
    }

    private reflectModel(policy: Type<IDatabaseAdapter>): DatabaseAdapterConfig {
        return Reflect.getMetadata(DATABASE_ADAPTER_METADATA, policy) as DatabaseAdapterConfig;
    }

    public getAdapter(type?: string): IDatabaseAdapter {
        if (!isNotEmpty(type)) {
            throw new Error(`You must provide a type`);
        }

        const adapter = this.registry.get(type);
        if (!isDefined(adapter)) {
            throw new Error(`No database adapters found for type ${type}`);
        }

        return adapter;
    }

    public getModels(): AccessControlModel[] {
        const models: AccessControlModel[] = [];
        for (const adapter of this.registry.values()) {
            models.push(...adapter.getModels());
        }
        return models;
    }
}
