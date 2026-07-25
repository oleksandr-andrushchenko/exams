import { QuestionChoice, QuestionDifficulty, QuestionType } from './CreateQuestion'

export default interface UpdateQuestion {
  examId?: string
  title?: string
  type: QuestionType
  choices?: QuestionChoice[]
  difficulty?: QuestionDifficulty
}