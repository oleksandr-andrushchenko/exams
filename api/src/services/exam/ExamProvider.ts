import { Inject, Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import ExamRepository from '../../repositories/exam/ExamRepository'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import { ObjectId } from 'bson'
import ValidatorInterface from '../validator/ValidatorInterface'

@Service()
export default class ExamProvider {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {ObjectId | string} id
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   */
  public async getExam(id: ObjectId | string): Promise<Exam> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const exam = await this.examRepository.findOneById(id)

    if (!exam) {
      throw new ExamNotFoundError(id)
    }

    return exam
  }
}