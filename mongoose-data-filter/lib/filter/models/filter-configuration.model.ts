import { FilterType } from "../type";
import { RadioFilterOptionConfiguration } from "../filters";

export interface FilterOperatorsConfiguration {
    id: string;
    name: string;
}

export interface FilterGroupConfiguration {
    key: string;
    name: string;
}

export interface FilterBaseConfigurationModel {
    type: FilterType;
    operators: FilterOperatorsConfiguration[];
    values?: unknown[];
    lazyLoading?: boolean;
    options?: RadioFilterOptionConfiguration[];
    group?: FilterGroupConfiguration;
}

export interface FilterConfigurationModel extends FilterBaseConfigurationModel {
    id: string;
    name: string;
}

export interface GroupFilterBaseConfigurationModel {
    type: FilterType;
    rootFilter: FilterBaseConfigurationModel;
    valueFilter?: FilterBaseConfigurationModel;
    lazyLoading?: boolean;
    group?: FilterGroupConfiguration;
}

export interface GroupFilterConfigurationModel extends GroupFilterBaseConfigurationModel {
    id: string;
    name: string;
}
