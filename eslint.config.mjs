import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  // Ignore patterns
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      '.env*',
      'scripts/**', // Allow console.log in scripts
      'supabase/migrations/**',
      '**/*.sql',
      '*.config.js',
      '*.config.mjs',
      'docs/**',
      'README.md',
      '.git/**',
      'coverage/**',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('prettier'), // Disables ESLint rules that conflict with Prettier
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      prettier: (await import('eslint-plugin-prettier')).default,
    },
    rules: {
      // React specific rules
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // Prettier integration
      'prettier/prettier': 'error',

      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',

      // Disable unused vars rules to avoid build issues
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Additional lenient rules for development
      'react/prop-types': 'off', // Not needed with TypeScript
      'react/display-name': 'off',
      '@next/next/no-img-element': 'off', // Allow img elements alongside Next.js Image

      // Import organization
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]

export default eslintConfig
