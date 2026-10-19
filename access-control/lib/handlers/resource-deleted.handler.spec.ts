import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResourceDeletedCommand } from "../commands/resource-deleted.command";
import { AccessRules } from "../models/access-rules.model";
import type { UserResources } from "../models/user-resources.model";
import type { ResourceAccessService } from "../services/resource-access.service";
import type { ResourceDeletedPoliciesService } from "../services/resource-deleted-policies.service";
import { AccessControlResourceDeletedHandler } from "./resource-deleted.handler";

describe(AccessControlResourceDeletedHandler, () => {
    let underTest: AccessControlResourceDeletedHandler;

    let resourceDeletedPoliciesService: Pick<ResourceDeletedPoliciesService, "execute">;
    let resourceAccessService: Pick<ResourceAccessService, "deleteResourceAccesses" | "updateUserResources">;

    beforeEach(() => {
        resourceDeletedPoliciesService = { execute: vi.fn<ResourceDeletedPoliciesService["execute"]>() };
        resourceAccessService = {
            deleteResourceAccesses: vi.fn<ResourceAccessService["deleteResourceAccesses"]>(),
            updateUserResources: vi.fn<ResourceAccessService["updateUserResources"]>()
        };
        underTest = new AccessControlResourceDeletedHandler(
            resourceDeletedPoliciesService as ResourceDeletedPoliciesService,
            resourceAccessService as ResourceAccessService
        );
    });

    it("removes resource accesses when a resource id is provided", async () => {
        expect.assertions(2);

        vi.mocked(resourceDeletedPoliciesService.execute).mockResolvedValue([]);

        await underTest.execute(new ResourceDeletedCommand("posts", { id: 1 }, 42));

        expect(resourceAccessService.deleteResourceAccesses).toHaveBeenCalledWith("posts", 42);
        expect(resourceAccessService.updateUserResources).toHaveBeenCalledWith([]);
    });

    it("persists access when policies return results", async () => {
        expect.assertions(1);

        const results: UserResources[] = [{ userId: "user-1", rules: AccessRules.all(), resourceId: 1 }];
        vi.mocked(resourceDeletedPoliciesService.execute).mockResolvedValue(results);

        await underTest.execute(new ResourceDeletedCommand("posts", { id: 1 }, 99));

        expect(resourceAccessService.updateUserResources).toHaveBeenCalledWith(results);
    });
});
