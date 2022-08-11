module.exports = {
    extends: "@recursyve/eslint-config-node",
    overrides: [
        {
            files: ["*.ts"],
            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: __dirname
            }
        }
    ]
};
