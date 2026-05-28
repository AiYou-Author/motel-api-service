module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
    ],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['cli/**/*.js', 'scripts/**/*.js', 'src/cli/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['src/models/redis.js', 'src/utils/logger.js', 'src/utils/lruCache.js', 'src/utils/runtimeAddon.js', 'src/utils/costCalculator.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['web/admin-spa/**/*.{js,vue}'],
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
        'eqeqeq': 'off',
      },
    },
    {
      files: ['web/admin-spa/dist/**/*.js'],
      rules: {
        'no-unused-vars': 'off',
        'eqeqeq': 'off',
        'no-console': 'off',
        'no-empty': 'off',
      },
    },
  ],
};