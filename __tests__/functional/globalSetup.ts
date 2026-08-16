import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

process.env.NODE_ENV = 'test'
process.env.DATABASE_TYPE ||= 'postgres'
process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/examme'
process.env.DATABASE_SCHEMA ||= 'public'
process.env.CLIENT_URL ||= 'http://localhost:3000'
process.env.PORT ||= '8081'

// @ts-ignore
export { globalSetup as default } from './index'
