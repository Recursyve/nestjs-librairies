import { Injectable } from "@nestjs/common";
import { TranslateAdapter } from "./translate.adapter";

@Injectable()
export class DefaultTranslateAdapter extends TranslateAdapter {
    public getTranslation(language: string, key: string): string {
        return key;
    }
}
