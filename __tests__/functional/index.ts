// @ts-ignore
import TestFramework from './TestFramework'

export const globalSetup = async () => {
  globalThis.framework = new TestFramework()

  await globalThis.framework.serverUp()
}

export const globalTeardown = async () => {
  await globalThis.framework.serverDown()
}