module.exports = {
  root: true, // Mark this as the root ESLint configuration
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "prettier", // Integrates Prettier rules into ESLint
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // Recommended TypeScript rules
    "prettier", // Disables ESLint rules that conflict with Prettier
  ],
  env: {
    node: true, // Assume Node.js environment by default
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "warn", // Show Prettier issues as warnings
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-unnecessary-type-constraint": "warn",
    "@typescript-eslint/prefer-as-const": "warn",
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    ".turbo/",
    "coverage/",
    "*.js", // Ignore JS config files by default if using CJS for configs
    "*.cjs",
    "*.mjs",
  ],
  overrides: [
    {
      // Override for frontend specific environment (e.g., browser)
      files: ["apps/frontend/**/*"],
      env: {
        browser: true,
        node: false, // Frontend code typically doesn't run in Node
      },
      // Add frontend specific rules if needed
    },
    {
      // Override for backend specific environment
      files: ["apps/backend/**/*"],
      env: {
        node: true, // Backend code runs in Node
      },
      // Add backend specific rules if needed
    },
  ],
};
