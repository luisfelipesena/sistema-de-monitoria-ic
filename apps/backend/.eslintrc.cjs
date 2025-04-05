/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true, // Stop ESLint from looking further up the directory tree
  extends: ["../../.eslintrc.cjs"], // Extends the root configuration
  parserOptions: {
    project: true, // Use the tsconfig.json in this directory
    tsconfigRootDir: __dirname,
  },
  // Add any backend-specific rules or overrides here if necessary
};
