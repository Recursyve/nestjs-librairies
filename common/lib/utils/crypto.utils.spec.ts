import { InternalServerErrorException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CryptoUtils } from "./crypto.utils";

const TEST_CRYPTO_KEY = Buffer.alloc(CryptoUtils.KEY_BYTE_LEN, 9).toString("base64");

describe("cryptoUtils", () => {
    beforeEach(() => {
        process.env["CRYPTO_KEY"] = TEST_CRYPTO_KEY;
    });

    afterEach(() => {
        delete process.env["CRYPTO_KEY"];
    });

    describe("getCryptoKey", () => {
        it("reads the key from CRYPTO_KEY", () => {
            expect.assertions(1);

            expect(CryptoUtils.getCryptoKey()).toStrictEqual(Buffer.from(TEST_CRYPTO_KEY, "base64"));
        });

        it("throws when CRYPTO_KEY is missing", () => {
            expect.assertions(1);

            delete process.env["CRYPTO_KEY"];

            expect(() => CryptoUtils.getCryptoKey()).toThrow(InternalServerErrorException);
        });
    });

    describe("getRandomKey", () => {
        it("returns a buffer of KEY_BYTE_LEN", () => {
            expect.assertions(1);

            expect(CryptoUtils.getRandomKey()).toHaveLength(CryptoUtils.KEY_BYTE_LEN);
        });
    });

    describe("getSalt", () => {
        it("returns a non-empty string", () => {
            expect.assertions(2);

            const salt = CryptoUtils.getSalt();

            expect(salt).toBeTypeOf("string");
            expect(salt.length).toBeGreaterThan(0);
        });
    });

    describe("getKeyFromPassword", () => {
        it("derives a key of KEY_BYTE_LEN from password and salt", () => {
            expect.assertions(1);

            const key = CryptoUtils.getKeyFromPassword(Buffer.from("password"), CryptoUtils.getSalt());

            expect(key).toHaveLength(CryptoUtils.KEY_BYTE_LEN);
        });
    });

    describe("encrypt and decrypt", () => {
        it("round-trips message bytes with an explicit key", () => {
            expect.assertions(1);

            const key = CryptoUtils.getRandomKey();
            const message = Buffer.from("secret payload", "utf8");
            const cipherText = CryptoUtils.encrypt(message, key);

            expect(CryptoUtils.decrypt(cipherText, key).toString("utf8")).toBe("secret payload");
        });

        it("throws when the key length is invalid", () => {
            expect.assertions(1);

            const shortKey = Buffer.alloc(8);

            expect(() => CryptoUtils.encrypt(Buffer.from("x"), shortKey)).toThrow(InternalServerErrorException);
        });
    });

    describe("encryptToHexString and decryptFromHexString", () => {
        it("round-trips a string through the hex wire format", () => {
            expect.assertions(2);

            const key = CryptoUtils.getRandomKey();
            const wire = CryptoUtils.encryptToHexString("hello", key);

            expect(wire.startsWith("\\x")).toBe(true);
            expect(CryptoUtils.decryptFromHexString(wire, key)).toBe("hello");
        });

        it("returns the input unchanged when it is not hex-prefixed", () => {
            expect.assertions(1);

            expect(CryptoUtils.decryptFromHexString("plain-text", CryptoUtils.getRandomKey())).toBe("plain-text");
        });
    });
});
