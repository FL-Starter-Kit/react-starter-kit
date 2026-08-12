import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importX, { createNodeResolver } from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import prettierPlugin from 'eslint-plugin-prettier';

/**
 * Single source of truth for formatting. Prettier imports these options from
 * `prettier.config.js`, so the rules defined here determine prettier's behavior.
 */
export const prettierOptions = {
  semi: true,
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'all',
  tabWidth: 2,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: '*.md',
      options: { proseWrap: 'always' },
    },
  ],
};

/**
 * Dependency boundaries enforced by this configuration:
 *
 *   app/ ──────── can import: features, components, lib, hooks, utils, services
 *   features/<feature>/ ─ can import: components (ui), lib, hooks, utils, types
 *                 CANNOT import: app/, other features
 *   components/ ─ CANNOT import: features/ (UI must stay feature-agnostic)
 *   lib/ ──────── CANNOT import: features/, components/, hooks/ (infrastructure stays leaf)
 *   hooks/ ────── CANNOT import: features/, components/
 *   utils/ ────── CANNOT import: anything but types/ and other utils
 *
 * See docs/ARCHITECTURE.md#dependency-rules for the full dependency matrix.
 */
export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'test-results',
      'playwright-report',
      'coverage',
      'public/mockServiceWorker.js',
      '.agents',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['prettier.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['prettier.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-confusing-void-expression': 'error',
      // Primitives (`boolean | undefined` etc.) keep their falsy-vs-nullish
      // semantics; only non-primitive LHS are suggested for `??`.
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignorePrimitives: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name="log"]',
          message: 'Use the logger from @/lib/logging instead of console.log.',
        },
        {
          selector: 'MemberExpression[object.name="localStorage"]',
          message: 'Use @/lib/storage instead of accessing localStorage directly.',
        },
        {
          selector: 'MemberExpression[object.name="sessionStorage"]',
          message: 'Use @/lib/storage instead of accessing sessionStorage directly.',
        },
      ],
    },
  },
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: './tsconfig.json',
        }),
        createNodeResolver(),
      ],
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'before' },
            { pattern: '@/*/*.{css}', group: 'index', position: 'after' },
          ],
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/components',
              from: './src/features',
              message: 'UI components must not import from feature internals.',
            },
            {
              target: './src/components',
              from: './src/app',
              message: 'UI components must not import from the app layer.',
            },
            {
              target: './src/features/users',
              from: './src/features',
              except: ['./users'],
              message:
                'Features must not import from another feature. Extract shared code to lib/ or components/.',
            },
            {
              target: './src/features/auth',
              from: './src/features',
              except: ['./auth'],
              message:
                'Features must not import from another feature. Extract shared code to lib/ or components/.',
            },
            {
              target: './src/lib',
              from: ['./src/features', './src/components', './src/hooks', './src/app'],
              message: 'Infrastructure (lib) must not import from higher layers.',
            },
            {
              target: './src/hooks',
              from: ['./src/features', './src/components', './src/app'],
              message: 'Shared hooks must not import from higher layers.',
            },
            {
              target: './src/utils',
              from: ['./src/features', './src/components', './src/hooks', './src/lib', './src/app'],
              message: 'Utilities must be dependency-free.',
            },
          ],
        },
      ],
    },
  },
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': ['error', prettierOptions, { usePrettierrc: false }],
    },
  },
);
