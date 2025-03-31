import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { QueryModel } from "../filter/models/query.model";
import { Type } from "@nestjs/common";

export class FilterPageModel {
    @ApiProperty({ type: () => Number })
    number!: number;

    @ApiProperty({ type: () => Number })
    size!: number;

    @ApiPropertyOptional({ type: () => Number })
    offset?: number;
}

export class FilterSearchModel {
    @ApiProperty({ type: () => String })
    value!: string;
}

const directions = ["asc", "desc", ""] as const;
export type Direction = (typeof directions)[number];

export class OrderModel {
    @ApiProperty({ type: () => String })
    column!: string;

    @ApiPropertyOptional({ enum: directions })
    direction!: Direction;

    @ApiPropertyOptional({ type: () => Boolean })
    nullLast?: boolean;
}

@ApiExtraModels(OrderModel)
export class FilterQueryModel {
    @ApiPropertyOptional({ type: () => FilterPageModel })
    page?: FilterPageModel;

    @ApiPropertyOptional({ type: () => FilterSearchModel })
    search?: FilterSearchModel;

    @ApiPropertyOptional({ type: () => QueryModel })
    query?: QueryModel;

    @ApiPropertyOptional({
        oneOf: [
            {
                $ref: getSchemaPath(OrderModel),
            },
            {
                type: "array",
                items: { $ref: getSchemaPath(OrderModel) },
            },
        ],
    })
    order?: OrderModel | OrderModel[];

    @ApiPropertyOptional({ type: () => Object })
    data?: object;

    @ApiPropertyOptional({ type: () => String })
    groupBy?: string;
}

export interface FilterResultModel<T> {
    values: T[];
    total: number;
    page?: {
        number: number;
        size: number;
    };
}

export class PageModel {
    @ApiProperty({ type: () => Number })
    number!: number;

    @ApiProperty({ type: () => Number })
    size!: number;
}

export function FilterResultModelMixin<T extends Type>(Base: T): Type<FilterResultModel<T>> {
    class _FilterResultModel {
        @ApiProperty({ type: () => Base, isArray: true })
        values!: T[];

        @ApiProperty({ type: () => Number })
        total!: number;

        @ApiPropertyOptional({ type: () => PageModel })
        page?: PageModel;
    }

    Object.defineProperty(_FilterResultModel, "name", { value: `${Base.name}FilterResultModel` });

    return _FilterResultModel;
}
