import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "coverage/**", "*.js", "*.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: { 
      "@typescript-eslint": tseslint.plugin,
      sonarjs, 
      security 
    },
    rules: {
      // TypeScript 特定规则
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-var-requires": "error",

      // 复杂度控制
      "complexity": ["warn", 10],
      "max-depth": ["warn", 4],
      "max-lines": ["warn", 300],
      "max-lines-per-function": ["warn", 50],
      "max-params": ["warn", 5],

      // 代码质量
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "prefer-const": "error",
      "no-var": "error",

      // 安全规则
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "warn",

      // SonarJS 代码质量规则
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/no-duplicate-string": ["warn", { "threshold": 3 }],
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/no-redundant-boolean": "error",
      "sonarjs/prefer-immediate-return": "warn"
    }
  },
  {
    files: ["**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "max-lines-per-function": "off"
    }
  }
);