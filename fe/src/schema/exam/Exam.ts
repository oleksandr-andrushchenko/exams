import Rating from '../rating/Rating'

export default interface Exam {
  id?: string
  name?: string
  questionCount?: number
  approvedQuestionCount?: number
  requiredScore?: number
  voters?: number
  rating?: Rating
  isApproved?: boolean
  isOwner?: boolean
  isCreator?: boolean
  examSessionId?: string
  createdAt?: number
  updatedAt?: number
}