import Question from '../../entities/question/Question'
import ExamSession from '../../entities/examSession/ExamSession'

export default class ExamSessionQuestionSchema {
  public examSession?: ExamSession

  public question?: Question

  public choices?: string[]

  public number?: number

  public choice?: number

  public answer?: string
}
