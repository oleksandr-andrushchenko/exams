/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'

const config: Config = {
  clearMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageProvider: "v8",
  testMatch: [
    "**/__tests__/**/*.[t]s?(x)",
    '!**/__tests__/**/index.tsx',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        diagnostics: {
          ignoreCodes: [ 1343 ]
        },
        astTransformers: {
          before: [
            {
              path: 'node_modules/ts-jest-mock-import-meta',
              options: { metaObjectReplacement: { env: { VITE_API_BASE_URL: 'any' } } }
            }
          ]
        }
      }
    ],
  },
}

export default config
