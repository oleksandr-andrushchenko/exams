import { CategoryResolver } from './CategoryResolver'
import { AuthenticateResolver } from './AuthenticateResolver'
import { QuestionResolver } from './QuestionResolver'
import { ExamResolver } from './ExamResolver'
import { MeResolver } from './MeResolver'
import { UserResolver } from './UserResolver'
import { PermissionResolver } from './PermissionResolver'
import { ActivityResolver } from './ActivityResolver'

export const resolvers = [
  AuthenticateResolver,
  CategoryResolver,
  QuestionResolver,
  ExamResolver,
  MeResolver,
  UserResolver,
  PermissionResolver,
  ActivityResolver,
]