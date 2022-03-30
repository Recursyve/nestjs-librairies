import { RedisArrayUtils } from "./array.utils";

describe("RedisArrayUtils", () => {
    it("getSlices should returns valid slices", () => {
        const values = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            1, 2, 3, 4, 5, 6, 7
        ];

        const slices = RedisArrayUtils.getSlices(values, 10);
        expect(slices).toHaveLength(20);
        expect(slices[0]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[1]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[2]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[3]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[4]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[5]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[6]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[7]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[8]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[9]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[10]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[11]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[12]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[13]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[14]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[15]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[16]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[17]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[18]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(slices[19]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
});
