import { Inject, Service } from 'typedi'
import { ObjectId } from 'bson'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/question/Question'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'

@Service()
export default class QuestionProvider {
  public constructor(
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  /**
   * @param {ObjectId | string} id
   * @param {ObjectId | string} examId
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   */
  public async getQuestion(id: ObjectId | string, examId: ObjectId | string = undefined): Promise<Question> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const question = await this.questionRepository.findOneById(id)

    if (!question || (examId && question.examId.toString() !== examId.toString())) {
      throw new QuestionNotFoundError(id)
    }

    return question
  }
}
