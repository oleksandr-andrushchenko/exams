import { Inject, Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import ExamRepository from '../../repositories/exam/ExamRepository'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import GetExams from '../../schema/exam/GetExams'
import PaginatedExams from '../../schema/exam/PaginatedExams'
import User from '../../entities/user/User'
import IdNormalizer from '../normalizers/IdNormalizer'
import ExamTagRepository from '../../repositories/examTag/ExamTagRepository'

@Service()
export default class ExamListProvider {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly idNormalizer: IdNormalizer,
    @Inject() private readonly examTagRepository: ExamTagRepository,
  ) {
  }

  /**
   * @param {GetExams} getExams
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<Exam[] | PaginatedExams>}
   * @throws {ValidatorError}
   */
  public async getExams(
    getExams: GetExams,
    meta: boolean = false,
    initiator?: User,
  ): Promise<Exam[] | PaginatedExams> {
    await this.validator.validate(getExams)

    const cursor = new Cursor<Exam>(getExams, this.examRepository)
    const where: Partial<Record<keyof Exam, any>> = {}

    if ('subscription' in getExams) {
      where['subscription'] = { $exists: getExams.subscription === 'yes' }
    }

    if ('approved' in getExams) {
      where.ownerId = { $exists: getExams.approved !== 'yes' }
    }

    if ('search' in getExams) {
      where.name = { $regex: getExams.search, $options: 'i' }
    }

    if (getExams.userId) {
      where.creatorId = this.idNormalizer.normalizeId(getExams.userId)
    }

    if (getExams.tag) {
      const examIds = await this.examTagRepository.findExamIdsBySlug(getExams.tag)
      where.id = { $in: examIds.map(id => this.idNormalizer.normalizeId(id)) }
    }

    if ('creator' in getExams && initiator) {
      if (getExams.creator === 'i') {
        where.creatorId = initiator.id
      } else {
        where.creatorId = { $ne: initiator.id }
      }
    }

    return await cursor.getPaginated({ where, meta })
  }

  public async getExamsByIds(examIds: string[]): Promise<Exam[]> {
    const ids = examIds.map(examId => this.idNormalizer.normalizeId(examId))

    return await this.examRepository.findByIds(ids)
  }
}