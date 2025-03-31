import { FilterType } from "../type";
import { OptionsFilterOptionConfiguration, OptionsFilterSelectionMode, optionsFilterSelectionModes } from "../filters";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class FilterOperatorsConfiguration {
    @ApiProperty({ type: () => String })
    id!: string;

    @ApiProperty({ type: () => String })
    name!: string;
}

export class FilterGroupConfiguration {
    @ApiProperty({ type: () => String })
    key!: string;

    @ApiProperty({ type: () => String })
    name!: string;
}

export class FilterBaseConfigurationModel {
    @ApiProperty({ enum: FilterType })
    type!: FilterType;

    @ApiProperty({ isArray: true, type: () => FilterOperatorsConfiguration })
    operators!: FilterOperatorsConfiguration[];

    @ApiPropertyOptional({ isArray: true, type: () => Object })
    values?: unknown[];

    @ApiPropertyOptional({ type: () => Boolean })
    lazyLoading?: boolean;

    @ApiPropertyOptional({ enum: optionsFilterSelectionModes })
    selectionMode?: OptionsFilterSelectionMode;

    @ApiPropertyOptional({ isArray: true, type: () => OptionsFilterOptionConfiguration })
    options?: OptionsFilterOptionConfiguration[];

    @ApiPropertyOptional({ type: () => FilterGroupConfiguration })
    group?: FilterGroupConfiguration;

    @ApiPropertyOptional({ type: () => String })
    mask?: string;
}

export class FilterConfigurationModel extends FilterBaseConfigurationModel {
    @ApiProperty({ type: () => String })
    id!: string;

    @ApiProperty({ type: () => String })
    name!: string;
}

export class GroupFilterBaseConfigurationModel {
    @ApiProperty({ enum: FilterType })
    type!: FilterType;

    @ApiProperty({ type: () => FilterBaseConfigurationModel })
    rootFilter!: FilterBaseConfigurationModel | null;

    @ApiPropertyOptional({ type: () => FilterBaseConfigurationModel })
    valueFilter?: FilterBaseConfigurationModel | null;

    @ApiPropertyOptional({ type: () => Boolean })
    lazyLoading?: boolean;

    @ApiPropertyOptional({ type: () => FilterGroupConfiguration })
    group?: FilterGroupConfiguration;
}

export class GroupFilterConfigurationModel extends GroupFilterBaseConfigurationModel {
    @ApiProperty({ type: () => String })
    id!: string;

    @ApiProperty({ type: () => String })
    name!: string;
}
