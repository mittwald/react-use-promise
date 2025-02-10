import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/*.js",
        "**/dist/**/*",
        "**/dist-cjs/**/*",
        "**/build/",
        "**/test-d/**/*",
    ],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
    },

    rules: {
        "linebreak-style": ["error", "unix"],

        quotes: ["error", "double", {
            avoidEscape: true,
        }],

        semi: ["error", "always"],

        "@typescript-eslint/no-unused-vars": ["error", {
            varsIgnorePattern: "[iI]gnored",
            argsIgnorePattern: "[iI]gnored",
            caughtErrorsIgnorePattern: "[iI]gnored",
        }],
    },
}];