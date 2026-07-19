import Rating from '../rating/Rating'
import ExamTag from '../examTag/ExamTag'

export default interface Exam {
  id?: string
  name?: string
  questionCount?: number
  approvedQuestionCount?: number
  requiredScore?: number
  voters?: number
  rating?: Rating
  tags?: ExamTag[]
  isApproved?: boolean
  isOwner?: boolean
  isCreator?: boolean
  examSessionId?: string
  createdAt?: number
  updatedAt?: number
}