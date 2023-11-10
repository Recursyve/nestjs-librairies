type Model = { model: any; type: string };

export interface ResourceAccessUpdatedPolicyConfig {
    // Source is the resource for which we want to listen to access changes.
    source: Model | Exclude<any, Model>;
    // Target is the resource that will have its accesses updated.
    target: Model | Exclude<any, Model>;
}
