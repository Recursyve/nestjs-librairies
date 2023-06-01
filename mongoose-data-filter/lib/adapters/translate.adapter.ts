export abstract class TranslateAdapter {
    public abstract getTranslation(language: string, key: string): Promise<string>;
}
