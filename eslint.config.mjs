import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.next/**',
      '**/out/**',
      '**/.turbo/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Template literals with numbers are fine; everything else stays strict.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // Tests index into fixtures they know exist; the assertion is clearer than a guard there.
    files: ['**/test/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    // Plain Node scripts and config files are not part of any tsconfig project.
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Safety rule (spec 3, 5.1): the triage engine is pure, deterministic and dependency-free.
    files: ['packages/triage-engine/src/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Date', property: 'now', message: 'Time must be injected (evaluate(..., now)).' },
        { object: 'Math', property: 'random', message: 'The engine must be deterministic.' },
        { object: 'performance', property: 'now', message: 'The engine must be deterministic.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Time must be injected: never construct Date with no arguments.',
        },
        {
          selector: "CallExpression[callee.name='Date']",
          message: 'Time must be injected: never call Date() directly.',
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['fetch', 'process', 'console', 'setTimeout', 'setInterval', 'localStorage', 'window']
          .concat(['document', 'crypto', 'require'])
          .map((name) => ({ name, message: 'The engine has no I/O and no environment access.' })),
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^[^.]',
              message: 'triage-engine has zero runtime dependencies: only relative imports.',
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
);
