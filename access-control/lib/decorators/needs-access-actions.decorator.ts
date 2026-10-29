import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

import type { AccessAction, AccessActionType } from "../models/access-rules.model";
import { accessActionTypeValues } from "../models/access-rules.model";
import { NEEDS_ACCESS_ACTIONS } from "./constant";

function isAccessAction(value: AccessAction | AccessActionType): value is AccessAction {
    return typeof value === "object" && "type" in value && "resourceIdParameterName" in value;
}

// AccessControl for a handler of a controller. You can either pass the type of access, in which case the parameter name
// for the resource id used will default to ":id". Or you can pass and AccessAction in which you define the type and the
// parameter name for the resource id.
export const NeedsAccessActions = (...accessActions: (AccessAction | AccessActionType)[]): CustomDecorator => {
    const accessActionAsObjects: AccessAction[] = [];

    for (const accessAction of accessActions) {
        if (isAccessAction(accessAction)) {
            accessActionAsObjects.push(accessAction);
        } else if (accessActionTypeValues.includes(accessAction)) {
            accessActionAsObjects.push({
                type: accessAction,
                resourceIdParameterName: "id"
            });
        } else {
            console.log(`Unable to process action provided: ${accessAction}`);
        }
    }

    return SetMetadata(NEEDS_ACCESS_ACTIONS, accessActionAsObjects);
};
