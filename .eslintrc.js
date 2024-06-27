module.exports = {
  extends: [
    // 'plugin:@darraghor/nestjs-typed/recommended',
    // 'plugin:@darraghor/nestjs-typed/no-swagger',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'es2019',
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  // plugins: ['@darraghor/nestjs-typed', '@typescript-eslint/eslint-plugin'],
  plugins: ['@typescript-eslint/eslint-plugin'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'generated/**'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
