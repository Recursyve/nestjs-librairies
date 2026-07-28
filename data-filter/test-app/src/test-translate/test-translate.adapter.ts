import { Injectable } from "@nestjs/common";
import { TranslateAdapter } from "@recursyve/nestjs-data-filter";

/**
 * Language-sensitive translate adapter for filter-service characterization.
 * Export keys stay unchanged so existing CSV assertions remain stable.
 */
@Injectable()
export class TestTranslateAdapter extends TranslateAdapter {
    public async getTranslation(language: string, key: string): Promise<string> {
        if (key.startsWith("exports.")) {
            return Promise.resolve(key);
        }

        return Promise.resolve(`${key}@${language}`);
    }
}
