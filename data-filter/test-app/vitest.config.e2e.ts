import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [swc.vite()],
    test: {
        globals: true,
        include: ["**/*.e2e-spec.ts"]
    }
});
