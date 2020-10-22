// src: https://stackoverflow.com/a/53573115
// We just added typescript typing
import { CipherGCM, CipherGCMOptions, createCipheriv, createDecipheriv, DecipherGCM, randomBytes, scryptSync } from "crypto";
import { InternalServerErrorException } from "@nestjs/common";

export namespace CryptoUtils {
    const ALGORITHM = {
        /**
         * GCM is an authenticated encryption mode that
         * not only provides confidentiality but also
         * provides integrity in a secured way
         *
         */
        BLOCK_CIPHER: "aes-256-gcm",

        /**
         * 128 bit auth tag is recommended for GCM
         */
        AUTH_TAG_BYTE_LEN: 16,

        /**
         * NIST recommends 96 bits or 12 bytes IV for GCM
         * to promote interoperability, efficiency, and
         * simplicity of design
         */
        IV_BYTE_LEN: 12,

        /**
         * Note: 256 (in algorithm name) is key size.
         * Block size for AES is always 128
         */
        KEY_BYTE_LEN: 32,

        /**
         *
         * To prevent rainbow table attacks
         *
         */
        SALT_BYTE_LEN: 16,

        OPTIONS: {
            authTagLength: 16
        } as CipherGCMOptions
    };

    export const KEY_BYTE_LEN = ALGORITHM.KEY_BYTE_LEN;

    function getIV(): Buffer {
        return randomBytes(ALGORITHM.IV_BYTE_LEN);
    }

    export function getRandomKey(): Buffer {
        return randomBytes(ALGORITHM.KEY_BYTE_LEN);
    }

    /**
     * To prevent rainbow table attacks
     */
    export function getSalt() {
        return randomBytes(ALGORITHM.SALT_BYTE_LEN).toString();
    }

    /**
     *
     * @param password - The password to be used for generating key
     * @param salt - A random string
     *
     * To be used when key needs to be generated based on password.
     * The caller of this function has the responsibility to clear
     * the Buffer after the key generation to prevent the password
     * from lingering in the memory
     */
    export function getKeyFromPassword(password: Buffer, salt: string) {
        return scryptSync(password, salt, ALGORITHM.KEY_BYTE_LEN);
    }

    function validateKey(key: Buffer) {
        if (!key || key.length !== KEY_BYTE_LEN) {
            throw new InternalServerErrorException("Invalid crypto key");
        }
    }

    /**
     *
     * @param messageText - The clear text message to be encrypted
     * @param key - The key to be used for encryption
     *
     * The caller of this function has the responsibility to clear
     * the Buffer after the encryption to prevent the message text
     * and the key from lingering in the memory
     */
    export function encrypt(messageText: Buffer, key = CryptoUtils.getCryptoKey()): Buffer {
        validateKey(key);
        const iv = getIV();
        const cipher = createCipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, ALGORITHM.OPTIONS) as CipherGCM;
        let encryptedMessage = cipher.update(messageText);
        encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
        return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
    }

    export function encryptToHexString(messagetext: string, key = CryptoUtils.getCryptoKey()): string {
        const encrypted = encrypt(Buffer.from(messagetext, "utf8"), key);
        return `\\x${encrypted.toString("hex")}`;
    }

    /**
     *
     * @param cipherText - Cipher text
     * @param key - The key to be used for decryption
     *
     * The caller of this function has the responsibility to clear
     * the Buffer after the decryption to prevent the message text
     * and the key from lingering in the memory
     */
    export function decrypt(cipherText: Buffer, key = CryptoUtils.getCryptoKey()): Buffer {
        validateKey(key);
        const authTag = cipherText.slice(-16);
        const iv = cipherText.slice(0, 12);
        const encryptedMessage = cipherText.slice(12, -16);
        const decipher = createDecipheriv(ALGORITHM.BLOCK_CIPHER, key, iv, ALGORITHM.OPTIONS) as DecipherGCM;
        decipher.setAuthTag(authTag);
        const messagetext = decipher.update(encryptedMessage);
        return Buffer.concat([messagetext, decipher.final()]);
    }

    export function decryptFromHexString(cipherText: string, key = CryptoUtils.getCryptoKey()): string {
        if (cipherText.slice(0, 2) !== "\\x") {
            return cipherText;
        }
        return decrypt(Buffer.from(cipherText.slice(2), "hex"), key).toString("utf8");
    }

    export function getCryptoKey() {
        const keyBase64 = process.env.CRYPTO_KEY;
        if (!keyBase64) {
            throw new InternalServerErrorException("Invalid crypto key");
        }
        return Buffer.from(keyBase64, "base64");
    }
}
