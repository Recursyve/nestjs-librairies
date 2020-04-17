import { TranslateAdapter } from "./translate.adapter";

export class DefaultTranslateAdapter extends TranslateAdapter {
    public getTranslation(language: string, key: string): string {
        return key;
    }
}
