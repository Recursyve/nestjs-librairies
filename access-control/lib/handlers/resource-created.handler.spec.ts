import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResourceCreatedCommand } from "../commands/resource-created.command";
import { AccessRules } from "../models/access-rules.model";
import type { UserResources } from "../models/user-resources.model";
import type { ResourceAccessService } from "../services/resource-access.service";
import type { ResourceCreatedPoliciesService } from "../services/resource-created-policies.service";
import { AccessControlResourceCreatedHandler } from "./resource-created.handler";

describe(AccessControlResourceCreatedHandler, () => {
    let underTest: AccessControlResourceCreatedHandler;

    let resourceCreatedPoliciesService: Pick<ResourceCreatedPoliciesService, "execute">;
    let resourceAccessService: Pick<ResourceAccessService, "addUserResources">;

    beforeEach(() => {
        resourceCreatedPoliciesService = { execute: vi.fn<ResourceCreatedPoliciesService["execute"]>() };
        resourceAccessService = { addUserResources: vi.fn<ResourceAccessService["addUserResources"]>() };
        underTest = new AccessControlResourceCreatedHandler(
            resourceCreatedPoliciesService as ResourceCreatedPoliciesService,
            resourceAccessService as ResourceAccessService
        );
    });

    it("forwards an empty result set to ResourceAccessService", async () => {
        expect.assertions(2);

        vi.mocked(resourceCreatedPoliciesService.execute).mockResolvedValue([]);

        await underTest.execute(new ResourceCreatedCommand("posts", { id: 1 }));

        expect(resourceCreatedPoliciesService.execute).toHaveBeenCalledWith("posts", { id: 1 });
        expect(resourceAccessService.addUserResources).toHaveBeenCalledWith([]);
    });

    it("persists access when policies return results", async () => {
        expect.assertions(1);

        const results: UserResources[] = [{ userId: "user-1", rules: AccessRules.all(), resourceId: 1 }];
        vi.mocked(resourceCreatedPoliciesService.execute).mockResolvedValue(results);

        await underTest.execute(new ResourceCreatedCommand("posts", { id: 1 }));

        expect(resourceAccessService.addUserResources).toHaveBeenCalledWith(results);
    });
});
