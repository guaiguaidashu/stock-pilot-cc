const { FlatCompat } = require("@eslint/eslint-compat");
const tseslint = require("typescript-eslint");
const reactHooks = require("eslint-plugin-react-hooks");
const react = require("eslint-plugin-react");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const importPlugin = require("eslint-plugin-import");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

module.exports = [
  { ignores: ["!.next/**", "!out/**", "!build/**"] },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
  }),
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
      react,
      jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
  },
];
