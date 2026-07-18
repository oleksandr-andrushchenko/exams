import { ExamResolver } from './ExamResolver'
import { AuthenticateResolver } from './AuthenticateResolver'
import { QuestionResolver } from './QuestionResolver'
import { ExamSessionResolver } from './ExamSessionResolver'
import { MeResolver } from './MeResolver'
import { UserResolver } from './UserResolver'
import { PermissionResolver } from './PermissionResolver'
import { ActivityResolver } from './ActivityResolver'

export const resolvers = [
  AuthenticateResolver,
  ExamResolver,
  QuestionResolver,
  ExamSessionResolver,
  MeResolver,
  UserResolver,
  PermissionResolver,
  ActivityResolver,
]