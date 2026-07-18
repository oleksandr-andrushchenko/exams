// @ts-ignore
import { ExamEvent } from './exam/ExamEvent'
import QuestionEvent from './question/QuestionEvent'
import ExamSessionEvent from './examSession/ExamSessionEvent'
import UserEvent from './user/UserEvent'
import MeEvent from './me/MeEvent'

export type Event = ExamEvent | QuestionEvent | ExamSessionEvent | UserEvent | MeEvent