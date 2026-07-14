import { Inject, Service } from 'typedi'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/question/Question'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import Cursor from '../../models/Cursor'
import GetQuestions from '../../schema/question/GetQuestions'
import PaginatedQuestions from '../../schema/question/PaginatedQuestions'
import User from '../../entities/user/User'

@Service()
export default class QuestionListProvider {

  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {GetQuestions} getQuestions
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<Question[] | PaginatedQuestions>}
   * @throws {ValidatorError}
   */
  public async getQuestions(
    getQuestions: GetQuestions,
    meta: boolean = false,
    initiator?: User,
  ): Promise<Question[] | PaginatedQuestions> {
    await this.validator.validate(getQuestions)

    const cursor = new Cursor<Question>(getQuestions, this.questionRepository)
    const where: Partial<Record<keyof Question, any>> = {}

    if ('category' in getQuestions) {
      where.categoryId = new ObjectId(getQuestions.category)
    }

    if ('subscription' in getQuestions) {
      where['subscription'] = { $exists: getQuestions.subscription === 'yes' }
    }

    if ('approved' in getQuestions) {
      where.ownerId = { $exists: getQuestions.approved !== 'yes' }
    }

    if ('search' in getQuestions) {
      where.title = { $regex: getQuestions.search, $options: 'i' }
    }

    if ('difficulty' in getQuestions) {
      where.difficulty = getQuestions.difficulty
    }

    if ('type' in getQuestions) {
      where.type = getQuestions.type
    }

    if ('creator' in getQuestions && initiator) {
      if (getQuestions.creator === 'i') {
        where.creatorId = initiator.id
      } else {
        where.creatorId = { $ne: initiator.id }
      }
    }

    return await cursor.getPaginated({ where, meta })
  }
}