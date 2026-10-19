import { describe, expect, it } from "vitest";

import { arrayUnique } from "./array.utils";

describe(arrayUnique, () => {
    it("removes duplicate primitives by value", () => {
        expect.assertions(1);

        expect(arrayUnique([1, 2, 2, 3, 1])).toStrictEqual([1, 2, 3]);
    });

    it("keeps the first occurrence when duplicates share a key", () => {
        expect.assertions(1);

        const first = { id: 1, label: "first" };
        const duplicate = { id: 1, label: "duplicate" };

        expect(arrayUnique([first, duplicate], (item) => item.id)).toStrictEqual([first]);
    });

    it("returns an empty array when the input is empty", () => {
        expect.assertions(1);

        expect(arrayUnique([])).toStrictEqual([]);
    });
});
