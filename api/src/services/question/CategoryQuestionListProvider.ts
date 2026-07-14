import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import Question from '../../entities/question/Question'
import GetQuestions from '../../schema/question/GetQuestions'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'
import QuestionListProvider from './QuestionListProvider'
import User from '../../entities/user/User'

@Service()
export default class CategoryQuestionListProvider {

  public constructor(
    @Inject() private readonly questionListProvider: QuestionListProvider,
  ) {
  }

  /**
   * @param {Category} category
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getCategoryQuestions(
    category: Category,
    getQuestions: GetQuestions = undefined,
    meta: boolean = false,
    initiator?: User,
  ): Promise<Question[] | PaginatedQuestions> {
    getQuestions = getQuestions === undefined ? new GetQuestions() : getQuestions
    getQuestions.category = category.id.toString()

    return this.questionListProvider.getQuestions(getQuestions, meta, initiator)
  }
}