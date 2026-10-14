import { Transform } from "class-transformer";

import { transformNullOrUndefined } from "./transform-null-or-undefined.util";

export const TransformNullOrUndefined = (): PropertyDecorator =>
    Transform(({ value }) => transformNullOrUndefined(value));
