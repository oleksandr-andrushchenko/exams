import path from 'path'
const pkg = require(path.resolve(process.cwd(), 'package.json'))
import Permission from '../../shared/src/enums/Permission'
import Env from './schema/config/Env'
import EnvValidator from './services/config/EnvValidator'
import ExamPermission from '../../shared/src/enums/exam/ExamPermission'
import QuestionPermission from '../../shared/src/enums/question/QuestionPermission'
import ExamSessionPermission from '../../shared/src/enums/examSession/ExamSessionPermission'
import { isDevelopmentEnvironment } from './services/config/Environment'

const env = new Env(process.env)
EnvValidator.validateEnv(env)

const environment: string = env.NODE_ENV

export default {
  env: environment,
  projectDir: path.resolve(process.cwd(), 'api-lambda/src'),
  client_url: env.CLIENT_URL,
  api_url: env.API_URL || 'http://localhost:8080',
  app: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    port: env.PORT
  },
  auth: {
    permissions: {
      [Permission.Regular]: [
        ExamPermission.Create,
        ExamPermission.Rate,
        QuestionPermission.Create,
        QuestionPermission.Rate,
        ExamSessionPermission.Create
      ],
      [Permission.Root]: [Permission.All]
    }
  },
  validator: {
    validationError: {
      target: false,
      value: true
    }
  },
  logger: {
    enabled: environment !== 'test',
    level: isDevelopmentEnvironment(environment) ? 'debug' : 'info',
    format: isDevelopmentEnvironment(environment) ? 'dev' : 'tiny'
  },
  db: {
    type: env.DATABASE_TYPE as 'postgres',
    url: env.DATABASE_URL as string,
    schema: env.DATABASE_SCHEMA || (environment === 'test' ? 'test' : 'public'),
    dropSchema: environment === 'test',
    synchronize: true,
    logging: isDevelopmentEnvironment(environment)
  },
  jwt: {
    secret: 'any'
  }
}
