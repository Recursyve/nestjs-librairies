import "reflect-metadata";

import type { ModuleRef } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccessControlModel, IDatabaseAdapter } from "../adapters/database.adapter";
import { DATABASE_ADAPTER_METADATA } from "../decorators/constant";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";

function AdapterModelA(): void {
    /* test model token */
}

function AdapterModelB(): void {
    /* test model token */
}

function createAdapter(models: AccessControlModel[]): IDatabaseAdapter {
    return {
        getModels: () => models,
        getResourceName: () => "resource",
        parseIds: (_model, ids) => ids,
        checkIfResourceExist: async () => Promise.resolve(true)
    };
}

describe(DatabaseAdaptersRegistry, () => {
    let moduleRef: { get: ReturnType<typeof vi.fn> };
    let underTest: DatabaseAdaptersRegistry;

    beforeEach(() => {
        moduleRef = { get: vi.fn<ModuleRef["get"]>() };
        underTest = new DatabaseAdaptersRegistry(moduleRef as never);
    });

    it("throws when getAdapter is called without a type", () => {
        expect.assertions(1);

        expect(() => underTest.getAdapter()).toThrow("You must provide a type");
    });

    it("throws when no adapter is registered for the type", () => {
        expect.assertions(1);

        expect(() => underTest.getAdapter("missing")).toThrow("No database adapters found for type missing");
    });

    it("returns a registered adapter by type", () => {
        expect.assertions(1);

        class PostsAdapter implements IDatabaseAdapter {
            public getModels(): AccessControlModel[] {
                return [];
            }

            public getResourceName(): string {
                return "posts";
            }

            public parseIds(_model: unknown, ids: string[] | string): string[] | string {
                return ids;
            }

            public async checkIfResourceExist(): Promise<boolean> {
                return Promise.resolve(true);
            }
        }

        Reflect.defineMetadata(DATABASE_ADAPTER_METADATA, { type: "posts" }, PostsAdapter);
        const instance = new PostsAdapter();
        moduleRef.get.mockReturnValue(instance);

        underTest.registerAdapters(PostsAdapter);

        expect(underTest.getAdapter("posts")).toBe(instance);
    });

    it("aggregates models from every registered adapter", () => {
        expect.assertions(1);

        class FirstAdapter implements IDatabaseAdapter {
            public getModels(): AccessControlModel[] {
                return [AdapterModelA];
            }

            public getResourceName(): string {
                return "first";
            }

            public parseIds(_model: unknown, ids: string[] | string): string[] | string {
                return ids;
            }

            public async checkIfResourceExist(): Promise<boolean> {
                return Promise.resolve(true);
            }
        }

        class SecondAdapter implements IDatabaseAdapter {
            public getModels(): AccessControlModel[] {
                return [AdapterModelB];
            }

            public getResourceName(): string {
                return "second";
            }

            public parseIds(_model: unknown, ids: string[] | string): string[] | string {
                return ids;
            }

            public async checkIfResourceExist(): Promise<boolean> {
                return Promise.resolve(true);
            }
        }

        Reflect.defineMetadata(DATABASE_ADAPTER_METADATA, { type: "first" }, FirstAdapter);
        Reflect.defineMetadata(DATABASE_ADAPTER_METADATA, { type: "second" }, SecondAdapter);
        moduleRef.get.mockImplementation((token: unknown) => {
            if (token === FirstAdapter) {
                return createAdapter([AdapterModelA]);
            }
            if (token === SecondAdapter) {
                return createAdapter([AdapterModelB]);
            }
            return undefined;
        });

        underTest.registerAdapters(FirstAdapter, SecondAdapter);

        expect(underTest.getModels()).toStrictEqual([AdapterModelA, AdapterModelB]);
    });
});
