/** @type {import('prettier').Config} */
export default {
    singleQuote: false,
    tabWidth: 4,
    trailingComma: "none",
    printWidth: 120,
    bracketSpacing: true,
    endOfLine: "lf",
    arrowParens: "always",
    plugins: ["prettier-plugin-organize-imports"],
    semi: true,
    useTabs: false
};
