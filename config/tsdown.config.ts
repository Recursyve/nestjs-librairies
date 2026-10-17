import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

const config: UserConfig = defineConfig({
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    exports: true,
    deps: {
        neverBundle: true
    },
    platform: "node",
    tsconfig: "tsconfig.json"
});

export default config;
