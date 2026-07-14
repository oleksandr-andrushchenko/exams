/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  restoreMocks: true,
  clearMocks: true,
  coverageProvider: 'v8',
  moduleFileExtensions: [ 'js', 'jsx', 'ts', 'tsx', 'json', 'node' ],
  testMatch: [
    '<rootDir>/__tests__/functional/cases/**/*.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globalSetup: '<rootDir>/__tests__/functional/globalSetup.ts',
  globalTeardown: '<rootDir>/__tests__/functional/globalTeardown.ts',
}

export default config