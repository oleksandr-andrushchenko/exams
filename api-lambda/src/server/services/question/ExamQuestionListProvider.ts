import { Inject, Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import Question from '../../entities/question/Question'
import GetQuestions from '../../schema/question/GetQuestions'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'
import QuestionListProvider from './QuestionListProvider'
import User from '../../entities/user/User'

@Service()
export default class ExamQuestionListProvider {
  public constructor(@Inject() private readonly questionListProvider: QuestionListProvider) {}

  /**
   * @param {Exam} exam
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getExamQuestions(
    exam: Exam,
    getQuestions: GetQuestions = undefined,
    meta: boolean = false,
    initiator?: User
  ): Promise<Question[] | PaginatedQuestions> {
    getQuestions = getQuestions === undefined ? new GetQuestions() : getQuestions
    getQuestions.exam = exam.id.toString()

    return this.questionListProvider.getQuestions(getQuestions, meta, initiator)
  }
}
