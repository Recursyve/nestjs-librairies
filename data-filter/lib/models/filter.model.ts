import { Type as _Type } from "@nestjs/common";
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { QueryModel } from "../filter/models/query.model";

export class FilterPageModel {
    @IsInt()
    @ApiProperty({ type: () => Number })
    number!: number;

    @IsInt()
    @ApiProperty({ type: () => Number })
    size!: number;

    @IsOptional()
    @IsInt()
    @ApiPropertyOptional({ type: () => Number })
    offset?: number;
}

export class FilterSearchModel {
    @IsString()
    @ApiProperty({ type: () => String })
    value!: string;
}

const directions = ["asc", "desc", ""] as const;
export type Direction = (typeof directions)[number];

export class OrderModel {
    @IsString()
    @ApiProperty({ type: () => String })
    column!: string;

    @IsOptional()
    @IsIn(directions)
    @ApiPropertyOptional({ enum: directions, enumName: "Direction" })
    direction!: Direction;

    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ type: () => Boolean })
    nullLast?: boolean;
}

@ApiExtraModels(OrderModel)
export class FilterQueryModel {
    @IsOptional()
    @ValidateNested()
    @Type(() => FilterPageModel)
    @ApiPropertyOptional({ type: () => FilterPageModel })
    page?: FilterPageModel;

    @IsOptional()
    @ValidateNested()
    @Type(() => FilterSearchModel)
    @ApiPropertyOptional({ type: () => FilterSearchModel })
    search?: FilterSearchModel;

    @IsOptional()
    @ValidateNested()
    @Type(() => QueryModel)
    @ApiPropertyOptional({ type: () => QueryModel })
    query?: QueryModel;

    @IsOptional()
    @ValidateNested()
    @Type(() => OrderModel)
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

    @IsOptional()
    @IsObject()
    @ApiPropertyOptional({ type: () => Object })
    data?: object;

    @IsOptional()
    @IsString()
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

export function FilterResultModelMixin<T extends _Type>(Base: T): _Type<FilterResultModel<T>> {
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
