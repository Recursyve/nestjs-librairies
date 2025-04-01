import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class FilterConfigurationSearchModel {
    @ApiProperty({ type: () => String })
    id!: string;

    @ApiProperty({ type: () => Object })
    value!: unknown;

    @ApiPropertyOptional({ type: () => Number })
    pageSize?: number;

    @ApiPropertyOptional({ type: () => Number })
    page?: number;
}
