import Exam from '../exam/Exam'

export default interface ExamSession {
  id?: string
  examId?: string
  exam?: Exam
  questionNumber?: number
  questionCount?: number
  correctAnswerCount?: number
  answeredQuestionCount?: number
  completedAt?: number
  ownerId?: string
  createdAt?: number
  updatedAt?: number
}