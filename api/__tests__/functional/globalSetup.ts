import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

// @ts-ignore
export { globalSetup as default } from './index'