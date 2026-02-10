import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
            "@typescript-eslint/no-unsafe-function-type": "warn",
        },
    },
];
