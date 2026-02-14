import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js base configuration
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Global configuration
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "import": importPlugin,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      // ============================================
      // Component Size Limits (from CLAUDE.md)
      // ============================================
      "max-lines": ["error", {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],

      // ============================================
      // TypeScript Rules
      // ============================================
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/explicit-function-return-type": ["warn", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/strict-boolean-expressions": ["warn", {
        allowString: true,
        allowNumber: true,
        allowNullableObject: true,
      }],
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      }],

      // ============================================
      // Import Organization
      // ============================================
      "import/order": ["error", {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        pathGroups: [
          {
            pattern: "react",
            group: "builtin",
            position: "before",
          },
          {
            pattern: "next/**",
            group: "builtin",
            position: "before",
          },
          {
            pattern: "@/**",
            group: "internal",
          },
        ],
        pathGroupsExcludedImportTypes: ["react", "next"],
      }],
      "import/no-duplicates": "error",
      // Note: import/no-unused-modules disabled due to ESLint 9 flat config incompatibility
      // See: https://github.com/import-js/eslint-plugin-import/issues/3079
      // "import/no-unused-modules": ["warn", { unusedExports: true }],
      "import/no-cycle": "error",
      "import/no-self-import": "error",

      // ============================================
      // React Best Practices
      // ============================================
      "react/jsx-no-leaked-render": "error",
      "react/jsx-key": ["error", {
        checkFragmentShorthand: true,
      }],
      "react/no-array-index-key": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-curly-brace-presence": ["warn", {
        props: "never",
        children: "never",
      }],
      "react/self-closing-comp": "warn",
      "react/jsx-boolean-value": ["warn", "never"],
      "react/function-component-definition": ["warn", {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      }],
      "react/jsx-no-target-blank": ["error", {
        allowReferrer: false,
        enforceDynamicLinks: "always",
      }],

      // ============================================
      // React Hooks
      // ============================================
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // ============================================
      // Accessibility (Critical for Hebrew/RTL)
      // ============================================
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/anchor-is-valid": "error",

      // ============================================
      // Code Quality
      // ============================================
      "no-console": ["warn", {
        allow: ["warn", "error"],
      }],
      "no-debugger": "error",
      "no-alert": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",
      "prefer-arrow-callback": "warn",
      "no-nested-ternary": "warn",
      "no-unneeded-ternary": "warn",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "curly": ["error", "all"],
      "no-param-reassign": ["error", {
        props: true,
        ignorePropertyModificationsFor: ["state", "acc", "draft"],
      }],

      // ============================================
      // Performance
      // ============================================
      "no-await-in-loop": "warn",
      "require-atomic-updates": "error",
    },
  },

  // Test file overrides
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/vitest.setup.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "max-lines": "off",
    },
  },

  // Script file overrides
  {
    files: ["scripts/**/*.ts", "scripts/**/*.mjs"],
    rules: {
      "no-console": "off",
      "import/no-unused-modules": "off",
    },
  },

  // Config file overrides
  {
    files: ["*.config.{js,mjs,ts}", "*.setup.{js,ts}"],
    rules: {
      "import/no-unused-modules": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
];

export default eslintConfig;
