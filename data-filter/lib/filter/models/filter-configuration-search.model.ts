import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDefined, IsInt, IsOptional, IsString } from "class-validator";

export class FilterConfigurationSearchModel {
    @IsString()
    @IsDefined()
    @ApiProperty({ type: () => String })
    id!: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ type: () => String })
    value!: unknown;

    @IsOptional()
    @IsInt()
    @ApiPropertyOptional({ type: () => Number })
    @Transform(({ value }) => typeof value === "string" ? parseInt(value) : value)
    pageSize?: number;

    @IsOptional()
    @IsInt()
    @ApiPropertyOptional({ type: () => Number })
    @Transform(({ value }) => typeof value === "string" ? parseInt(value) : value)
    page?: number;
}
