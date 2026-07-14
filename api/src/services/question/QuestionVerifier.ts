import { Inject, Service } from 'typedi'
import { ObjectId } from 'mongodb'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import QuestionTitleTakenError from '../../errors/question/QuestionTitleTakenError'

@Service()
export default class QuestionVerifier {

  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
  ) {
  }

  /**
   * @param {string} title
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {QuestionTitleTakenError}
   */
  public async verifyQuestionTitleNotExists(title: string, ignoreId: ObjectId = undefined): Promise<void> {
    const question = await this.questionRepository.findOneByTitle(title)

    if (!question) {
      return
    }

    if (ignoreId && question.id.toString() === ignoreId.toString()) {
      return
    }

    throw new QuestionTitleTakenError(title)
  }
}