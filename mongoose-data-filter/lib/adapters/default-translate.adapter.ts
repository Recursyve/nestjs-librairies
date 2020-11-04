import { Injectable } from "@nestjs/common";
import { TranslateAdapter } from "./translate.adapter";

@Injectable()
export class DefaultTranslateAdapter extends TranslateAdapter {
    public async getTranslation(language: string, key: string): Promise<string> {
        return key;
    }
}
