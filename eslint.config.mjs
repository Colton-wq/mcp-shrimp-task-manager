import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}", "**/*.js"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    },
    plugins: { sonarjs, security },
    rules: {
      "sonarjs/cognitive-complexity": ["warn", 15],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // security plugin example rules
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-fs-filename": "warn"
    }
  }
);
