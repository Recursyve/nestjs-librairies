export enum FilterOperatorTypes {
    Equal = "equal",
    NotEqual = "not_equal",
    In = "in",
    NotIn = "not_in",
    Less = "less",
    LessOrEqual = "less_or_equal",
    Greater = "greater",
    GreaterOrEqual = "greater_or_equal",
    Between = "between",
    NotBetween = "not_between",
    IsNull = "is_null",
    IsNotNull = "is_not_null",
    BeginsWith = "begins_with",
    NotBeginsWith = "not_begins_with",
    EndsWith = "ends_with",
    NotEndsWith = "not_ends_with",
    Contains = "contains",
    NotContains = "not_contains",
    IsEmpty = "is_empty",
    IsNotEmpty = "is_not_empty",
    Exists = "exists"
}

export type FilterOperators = FilterOperatorTypes | string;

export const SelectOperators: FilterOperatorTypes[] = [FilterOperatorTypes.Equal, FilterOperatorTypes.NotEqual];

export const StringOperators: FilterOperatorTypes[] = [
    FilterOperatorTypes.Equal,
    FilterOperatorTypes.NotEqual,
    FilterOperatorTypes.Contains,
    FilterOperatorTypes.BeginsWith,
    FilterOperatorTypes.NotBeginsWith,
    FilterOperatorTypes.EndsWith,
    FilterOperatorTypes.NotEndsWith
];

export const NumberOperators: FilterOperatorTypes[] = [
    ...SelectOperators,
    FilterOperatorTypes.Greater,
    FilterOperatorTypes.GreaterOrEqual,
    FilterOperatorTypes.Less,
    FilterOperatorTypes.LessOrEqual
];

export const DateOperators: FilterOperatorTypes[] = [
    ...NumberOperators,
    FilterOperatorTypes.Between,
    FilterOperatorTypes.NotBetween
];

export const NullOperators: FilterOperatorTypes[] = [FilterOperatorTypes.IsNull, FilterOperatorTypes.IsNotNull];
