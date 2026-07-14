import path from 'path'
// @ts-ignore
import pkg from '../package.json'
import Permission from './enums/Permission'
import Env from './schema/config/Env'
import EnvValidator from './services/config/EnvValidator'
import CategoryPermission from './enums/category/CategoryPermission'
import QuestionPermission from './enums/question/QuestionPermission'
import ExamPermission from './enums/exam/ExamPermission'

const env = new Env(process.env)
EnvValidator.validateEnv(env)

const environment: string = env.NODE_ENV

export default {
  env: environment,
  projectDir: path.resolve(__dirname, '..'),
  client_url: env.CLIENT_URL,
  app: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    port: env.PORT,
  },
  auth: {
    permissions: {
      [Permission.Regular]: [
        CategoryPermission.Create,
        CategoryPermission.Rate,
        QuestionPermission.Create,
        QuestionPermission.Rate,
        ExamPermission.Create,
      ],
      [Permission.Root]: [
        Permission.All,
      ],
    },
  },
  validator: {
    validationError: {
      target: false,
      value: true,
    },
  },
  logger: {
    enabled: environment !== 'test',
    level: environment === 'development' ? 'debug' : 'info',
    format: environment === 'development' ? 'dev' : 'tiny',
  },
  db: {
    type: env.DATABASE_TYPE as 'mongodb',
    url: env.DATABASE_URL as string,
    synchronize: false,
    logging: environment === 'development',
  },
  jwt: {
    secret: 'any',
  },
}
