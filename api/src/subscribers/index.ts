import QuestionSubscriber from './QuestionSubscriber'
import UserSubscriber from './UserSubscriber'
import CategoryCreatedEventSubscriber from './category/CategoryCreatedEventSubscriber'
import CategoryApprovedEventSubscriber from './category/CategoryApprovedEventSubscriber'
import CategoryRatedEventSubscriber from './category/CategoryRatedEventSubscriber'
import QuestionRatedEventSubscriber from './question/QuestionRatedEventSubscriber'
import ExamCreatedEventSubscriber from './exam/ExamCreatedEventSubscriber'
import ExamCompletedEventSubscriber from './exam/ExamCompletedEventSubscriber'
import ExamDeletedEventSubscriber from './exam/ExamDeletedEventSubscriber'

export default [
  CategoryCreatedEventSubscriber,
  CategoryApprovedEventSubscriber,
  CategoryRatedEventSubscriber,
  QuestionRatedEventSubscriber,
  ExamCreatedEventSubscriber,
  ExamCompletedEventSubscriber,
  ExamDeletedEventSubscriber,
]

export const subscribers = [
  QuestionSubscriber,
  UserSubscriber,
]