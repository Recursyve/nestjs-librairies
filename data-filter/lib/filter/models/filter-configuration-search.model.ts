import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class FilterConfigurationSearchModel {
    @Expose()
    @ApiProperty({ type: () => String })
    id!: string;

    @Expose()
    @ApiProperty({ type: () => Object })
    value!: unknown;

    @Expose()
    @ApiPropertyOptional({ type: () => Number })
    pageSize?: number;

    @Expose()
    @ApiPropertyOptional({ type: () => Number })
    page?: number;
}
