import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'scripts/**', '**/*.mjs', '**/*.cjs', '.terraform/**', '**/*.d.ts'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
    rules: { 'no-console': ['error', { allow: ['debug'] }] },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
)
