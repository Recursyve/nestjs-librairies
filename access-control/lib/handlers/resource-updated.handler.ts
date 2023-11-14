import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ResourceUpdatedCommand } from "../commands";
import { ResourceAccessService, ResourceUpdatedPoliciesService } from "../services";

@CommandHandler(ResourceUpdatedCommand)
export class AccessControlResourceUpdatedHandler implements ICommandHandler<ResourceUpdatedCommand<any>> {
    constructor(
        private resourceUpdatedPolicyService: ResourceUpdatedPoliciesService,
        private resourceAccessService: ResourceAccessService,
    ) {}

    public async execute(event: ResourceUpdatedCommand<any>): Promise<void> {
        const results = await this.resourceUpdatedPolicyService.execute(event.resourceName, event.before, event.after);
        if (results) {
            await this.resourceAccessService.updateUserResources(results);
        }
    }
}
