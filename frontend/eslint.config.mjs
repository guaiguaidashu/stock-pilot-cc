import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
        fetch: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      react,
      jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "import/no-anonymous-default-export": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
