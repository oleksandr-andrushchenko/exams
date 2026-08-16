import 'reflect-metadata'
import TestFramework from '../../../__tests__/functional/TestFramework'

const framework = new TestFramework()

framework
  .serverUp()
  .then(() => framework.seedDemoData())
  .then(() => framework.serverDown())
  .catch(async (error) => {
    console.error(error)
    await framework.serverDown()
    process.exitCode = 1
  })
