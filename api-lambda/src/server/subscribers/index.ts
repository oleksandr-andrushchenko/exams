import QuestionSubscriber from './QuestionSubscriber'
import UserSubscriber from './UserSubscriber'
import ExamCreatedEventSubscriber from './exam/ExamCreatedEventSubscriber'
import ExamApprovedEventSubscriber from './exam/ExamApprovedEventSubscriber'
import ExamRatedEventSubscriber from './exam/ExamRatedEventSubscriber'
import QuestionRatedEventSubscriber from './question/QuestionRatedEventSubscriber'
import ExamSessionCreatedEventSubscriber from './examSession/ExamSessionCreatedEventSubscriber'
import ExamSessionCompletedEventSubscriber from './examSession/ExamSessionCompletedEventSubscriber'
import ExamSessionDeletedEventSubscriber from './examSession/ExamSessionDeletedEventSubscriber'

export default [
  ExamCreatedEventSubscriber,
  ExamApprovedEventSubscriber,
  ExamRatedEventSubscriber,
  QuestionRatedEventSubscriber,
  ExamSessionCreatedEventSubscriber,
  ExamSessionCompletedEventSubscriber,
  ExamSessionDeletedEventSubscriber
]

export const subscribers = [QuestionSubscriber, UserSubscriber]
