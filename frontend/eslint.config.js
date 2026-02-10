import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    js.configs.recommended,
    {
        files: ["src/**/*.{ts,tsx}"],
        ignores: ["**/*.d.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                fetch: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                performance: "readonly",
                AbortController: "readonly",
                crypto: "readonly",
                URL: "readonly",
                Blob: "readonly",
                HTMLElement: "readonly",
                ServiceWorkerRegistration: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "no-undef": "off",
            "no-empty": "warn",
            "no-empty-pattern": "warn",
            "no-redeclare": "warn",
            "no-useless-escape": "warn",
            "react-hooks/rules-of-hooks": "warn",
            "react-hooks/exhaustive-deps": "warn",
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/purity": "warn",
            "react-hooks/static-components": "warn",
            "react-hooks/immutability": "warn",
            "react-hooks/preserve-manual-memoization": "warn",
            "no-dupe-else-if": "warn",
        },
    },
];
