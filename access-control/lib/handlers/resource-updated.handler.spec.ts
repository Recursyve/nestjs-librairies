import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResourceUpdatedCommand } from "../commands/resource-updated.command";
import { AccessRules } from "../models/access-rules.model";
import type { UserResources } from "../models/user-resources.model";
import type { ResourceAccessService } from "../services/resource-access.service";
import type { ResourceUpdatedPoliciesService } from "../services/resource-updated-policies.service";
import { AccessControlResourceUpdatedHandler } from "./resource-updated.handler";

describe(AccessControlResourceUpdatedHandler, () => {
    let underTest: AccessControlResourceUpdatedHandler;

    let resourceUpdatedPoliciesService: Pick<ResourceUpdatedPoliciesService, "execute">;
    let resourceAccessService: Pick<ResourceAccessService, "updateUserResources">;

    beforeEach(() => {
        resourceUpdatedPoliciesService = { execute: vi.fn<ResourceUpdatedPoliciesService["execute"]>() };
        resourceAccessService = { updateUserResources: vi.fn<ResourceAccessService["updateUserResources"]>() };
        underTest = new AccessControlResourceUpdatedHandler(
            resourceUpdatedPoliciesService as ResourceUpdatedPoliciesService,
            resourceAccessService as ResourceAccessService
        );
    });

    it("forwards an empty result set to ResourceAccessService", async () => {
        expect.assertions(2);

        const before = { id: 1, title: "old" };
        const after = { id: 1, title: "new" };
        vi.mocked(resourceUpdatedPoliciesService.execute).mockResolvedValue([]);

        await underTest.execute(new ResourceUpdatedCommand("posts", before, after));

        expect(resourceUpdatedPoliciesService.execute).toHaveBeenCalledWith("posts", before, after);
        expect(resourceAccessService.updateUserResources).toHaveBeenCalledWith([]);
    });

    it("persists access when policies return results", async () => {
        expect.assertions(1);

        const results: UserResources[] = [{ userId: "user-1", rules: AccessRules.all(), resourceId: 1 }];
        vi.mocked(resourceUpdatedPoliciesService.execute).mockResolvedValue(results);

        await underTest.execute(new ResourceUpdatedCommand("posts", { id: 1 }, { id: 1, title: "new" }));

        expect(resourceAccessService.updateUserResources).toHaveBeenCalledWith(results);
    });
});
