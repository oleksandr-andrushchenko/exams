import { QuestionChoice, QuestionDifficulty, QuestionType } from './CreateQuestion'
import Exam from '../exam/Exam'
import Rating from '../rating/Rating'

export default interface Question {
  id?: string
  examId?: string
  exam?: Exam
  title?: string
  type?: QuestionType
  choices?: QuestionChoice[]
  difficulty?: QuestionDifficulty
  multiChoice?: boolean
  rating?: Rating
  isApproved?: boolean
  isOwner?: boolean
  isCreator?: boolean
  createdAt?: number
  updatedAt?: number

  // todo: add tags
}