// @ts-check
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-next`
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      // Tells eslint-plugin-react to automatically detect the version of React to use
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
      typescript: {
        // Always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
        alwaysTryTypes: true,
      },
    },
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-hooks',
    'jsx-a11y',
    'import',
    'prettier',
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true,
      },
    ],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-expect-error': 'allow-with-description' },
    ],

    // React rules
    'react/prop-types': 'off', // We use TypeScript for type checking
    'react/react-in-jsx-scope': 'off', // Not needed with Next.js
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.jsx', '.tsx'] },
    ],
    'react/display-name': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-uses-react': 'off',
    'react/no-unescaped-entities': 'off',
    'react/require-default-props': 'off',
    'react/jsx-no-target-blank': [
      'error',
      { enforceDynamicLinks: 'always' },
    ],

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import rules
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
          'object',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-cycle': 'error',
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/export': 'error',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-duplicates': 'error',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],

    // General rules
    'no-console': [
      'warn',
      { allow: ['warn', 'error', 'info', 'table', 'group', 'groupEnd'] },
    ],
    'no-debugger': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'object-shorthand': ['error', 'always'],
    'no-nested-ternary': 'warn',
    'prefer-template': 'error',
    'no-useless-escape': 'off',
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-unused-expressions': [
      'error',
      { allowShortCircuit: true, allowTernary: true },
    ],

    // JSX a11y rules
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['invalidHref', 'preferButton'],
      },
    ],
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
  },
  overrides: [
    {
      // Enable TypeScript specific rules for TypeScript files
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript's `noFallthroughCasesInSwitch` option is more robust
        'default-case': 'off',
        // TypeScript already handles this
        'no-dupe-args': 'off',
        'no-dupe-keys': 'off',
        'no-unreachable': 'off',
        'valid-typeof': 'off',
        'no-const-assign': 'off',
        'no-new-symbol': 'off',
        'no-this-before-super': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'no-useless-constructor': 'off',
      },
    },
    {
      // Disable some rules for test files
      files: ['**/__tests__/**/*', '**/*.test.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
      },
    },
  ],
};

// This configuration provides a solid foundation for a Next.js TypeScript project with:
// - TypeScript support
// - React and React Hooks rules
// - Import/export rules
// - Accessibility rules
// - Code style consistency
// - Performance best practices
// - Security best practices
