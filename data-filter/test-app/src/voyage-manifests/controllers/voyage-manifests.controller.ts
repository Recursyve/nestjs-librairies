import { Controller } from "@nestjs/common";
import {
    DynamicFilterController,
    FilterOperatorTypes,
    FilterQueryModel,
    FilterService,
    InjectFilter,
    OpenApiDynamicFilterController
} from "@recursyve/nestjs-data-filter";
import { VoyageManifestsData, VoyageManifestsFilter } from "../filters/voyage-manifests.filter";

/**
 * Characterizes DynamicFilterController.transformQuery: injects a season equality
 * rule from the x-voyage-season request header before filtering.
 */
@Controller("voyage-manifests")
export class VoyageManifestsController extends DynamicFilterController<VoyageManifestsData> {
    constructor(@InjectFilter(VoyageManifestsFilter) filterService: FilterService<VoyageManifestsData>) {
        super(filterService);
    }

    protected transformQuery(
        query: FilterQueryModel,
        request: { headers?: Record<string, string | string[] | undefined> }
    ): FilterQueryModel {
        const raw = request.headers?.["x-voyage-season"];
        const season = Array.isArray(raw) ? raw[0] : raw;
        if (!season) {
            return query;
        }

        const seasonRule = {
            id: "season",
            operation: FilterOperatorTypes.Equal,
            value: season
        };

        if (!query.query) {
            return {
                ...query,
                query: { condition: "and", rules: [seasonRule] }
            };
        }

        return {
            ...query,
            query: {
                ...query.query,
                condition: "and",
                rules: [...(query.query.rules ?? []), seasonRule]
            }
        };
    }
}

/**
 * Characterizes OpenApiDynamicFilterController mixin wiring around DynamicFilterController.
 * Observable behavior mirrors voyage-manifests; swagger metadata is compile-time.
 */
@Controller("voyage-manifests-openapi")
export class VoyageManifestsOpenApiController extends OpenApiDynamicFilterController(VoyageManifestsData, {
    param: { name: "seasonHint", required: false }
}) {
    constructor(@InjectFilter(VoyageManifestsFilter) filterService: FilterService<VoyageManifestsData>) {
        super(filterService);
    }

    protected transformQuery(
        query: FilterQueryModel,
        request: { headers?: Record<string, string | string[] | undefined> }
    ): FilterQueryModel {
        const raw = request.headers?.["x-voyage-season"];
        const season = Array.isArray(raw) ? raw[0] : raw;
        if (!season) {
            return query;
        }

        return {
            ...query,
            query: {
                condition: "and",
                rules: [
                    ...(query.query?.rules ?? []),
                    {
                        id: "season",
                        operation: FilterOperatorTypes.Equal,
                        value: season
                    }
                ]
            }
        };
    }
}
