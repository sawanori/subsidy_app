const nextJest = require('next/jest')

/**
 * APP-100: Jest単体テスト設定
 * 70%+ カバレッジ目標、コンポーネント・フック・ユーティリティテスト
 */
const createJestConfig = nextJest({
  // Next.js app が存在するディレクトリを指定
  dir: './',
})

// Jest の追加設定
const customJestConfig = {
  // テスト環境の設定
  testEnvironment: 'jsdom',
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // テストファイルのパターン
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // 無視するパターン
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/storybook-static/'
  ],
  
  // カバレッジ設定
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // カバレッジ対象ファイル
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/test/**/*'
  ],
  
  // カバレッジ閾値（APP-100: 70%+目標）
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // 重要コンポーネントは80%以上
    './src/components/preview/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/hooks/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // モジュールマッピング
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  
  // 変換設定
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  
  // モックファイル
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // テスト環境変数
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // グローバルセットアップ
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react'
      }
    }
  },
  
  // タイムアウト設定
  testTimeout: 10000,
  
  // 並列実行
  maxWorkers: '50%',
  
  // リポーター設定
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/jest-html-report',
      filename: 'report.html',
      pageTitle: 'APP-100 Unit Test Report'
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml'
    }]
  ],
  
  // キャッシュ設定
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // verbose output
  verbose: true,
  
  // governance.yaml準拠メタデータ
  displayName: {
    name: 'APP-100 Unit Tests',
    color: 'blue'
  }
}

// Next.js設定とJest設定をマージして出力
module.exports = createJestConfig(customJestConfig)