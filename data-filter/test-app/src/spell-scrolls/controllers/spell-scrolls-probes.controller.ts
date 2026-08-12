import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { QueryModel, TextFilter } from "@recursyve/nestjs-data-filter";

/**
 * Characterizes Filter.usePathCondition — public on Filter, but never consulted
 * by FilterService when building queries (observed dead wiring for HTTP filter).
 */
@Controller("spell-scrolls-probes")
export class SpellScrollsProbesController {
    @Post("path-condition")
    @HttpCode(HttpStatus.OK)
    public usePathCondition(
        @Body()
        body: {
            pathCondition?: Record<string, unknown> | boolean;
            query: QueryModel;
        }
    ): { matched: boolean; pathCondition: unknown } {
        const filter = new TextFilter({
            attribute: "title",
            pathCondition: body.pathCondition ?? { manaCost: 3 }
        });

        return {
            matched: filter.usePathCondition(body.query),
            pathCondition: filter.pathCondition
        };
    }
}
