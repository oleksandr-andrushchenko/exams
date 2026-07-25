import ExamSession from './ExamSession'
import Question from '../question/Question'

export default interface ExamSessionQuestion {
  examSession?: ExamSession
  question?: Question
  choices?: string[]
  number?: number
  choice?: number
  answer?: string
}