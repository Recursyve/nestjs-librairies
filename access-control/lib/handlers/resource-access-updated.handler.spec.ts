import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResourceAccessUpdatedCommand } from "../commands/resource-access-updated.command";
import { AccessRules } from "../models/access-rules.model";
import type { UserResources } from "../models/user-resources.model";
import type { ResourceAccessUpdatedPoliciesService } from "../services/resource-access-updated-policies.service";
import type { ResourceAccessService } from "../services/resource-access.service";
import { AccessControlResourceAccessUpdatedHandler } from "./resource-access-updated.handler";

describe(AccessControlResourceAccessUpdatedHandler, () => {
    let underTest: AccessControlResourceAccessUpdatedHandler;

    let resourceAccessUpdatedPoliciesService: Pick<ResourceAccessUpdatedPoliciesService, "execute">;
    let resourceAccessService: Pick<ResourceAccessService, "updateUserResources">;

    beforeEach(() => {
        resourceAccessUpdatedPoliciesService = { execute: vi.fn<ResourceAccessUpdatedPoliciesService["execute"]>() };
        resourceAccessService = { updateUserResources: vi.fn<ResourceAccessService["updateUserResources"]>() };
        underTest = new AccessControlResourceAccessUpdatedHandler(
            resourceAccessUpdatedPoliciesService as ResourceAccessUpdatedPoliciesService,
            resourceAccessService as ResourceAccessService
        );
    });

    it("does nothing when user resources are empty", async () => {
        expect.assertions(2);

        await underTest.execute(new ResourceAccessUpdatedCommand([]));

        expect(resourceAccessUpdatedPoliciesService.execute).not.toHaveBeenCalled();
        expect(resourceAccessService.updateUserResources).not.toHaveBeenCalled();
    });

    it("skips policy execution when resource name or id is missing", async () => {
        expect.assertions(2);

        const userResources: UserResources[] = [{ userId: "user-1", rules: AccessRules.all() }];

        await underTest.execute(new ResourceAccessUpdatedCommand(userResources));

        expect(resourceAccessUpdatedPoliciesService.execute).not.toHaveBeenCalled();
        expect(resourceAccessService.updateUserResources).not.toHaveBeenCalled();
    });

    it("groups user resources by resource name and id before running policies", async () => {
        expect.assertions(2);

        const first: UserResources = {
            userId: "user-1",
            rules: AccessRules.all(),
            resourceName: "posts",
            resourceId: 1
        };
        const second: UserResources = {
            userId: "user-2",
            rules: AccessRules.all(),
            resourceName: "posts",
            resourceId: 1
        };
        const derived: UserResources[] = [
            { userId: "user-3", rules: AccessRules.all(), resourceName: "comments", resourceId: 2 }
        ];
        vi.mocked(resourceAccessUpdatedPoliciesService.execute).mockResolvedValue(derived);

        await underTest.execute(new ResourceAccessUpdatedCommand([first, second]));

        expect(resourceAccessUpdatedPoliciesService.execute).toHaveBeenCalledWith("posts", 1, [first, second]);
        expect(resourceAccessService.updateUserResources).toHaveBeenCalledWith(derived);
    });

    it("throws when a policy returns resources for the same resource name", async () => {
        expect.assertions(1);

        const userResources: UserResources[] = [
            {
                userId: "user-1",
                rules: AccessRules.all(),
                resourceName: "posts",
                resourceId: 1
            }
        ];
        vi.mocked(resourceAccessUpdatedPoliciesService.execute).mockResolvedValue([
            { userId: "user-2", rules: AccessRules.all(), resourceName: "posts", resourceId: 2 }
        ]);

        await expect(underTest.execute(new ResourceAccessUpdatedCommand(userResources))).rejects.toThrow(
            "Recursive policy detected for resource 'posts'"
        );
    });
});
