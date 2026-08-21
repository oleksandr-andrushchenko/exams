import { Inject, Service } from 'typedi'
import { ObjectId } from 'bson'
import Exam from '../../entities/exam/Exam'
import ExamRepository from '../../repositories/exams/ExamRepository'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import ValidatorInterface from '../validator/ValidatorInterface'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import ExamPermission from '../../enums/exam/ExamPermission'
import UserRepository from '../../repositories/users/UserRepository'
import isObjectId from '../../database/isObjectId'

@Service()
export default class ExamProvider {
  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject() private readonly userRepository: UserRepository
  ) {}

  private async canViewUnapproved(user?: User): Promise<boolean> {
    return !user || this.authorizationVerifier.hasAuthorization(user, ExamPermission.Get)
  }

  private async decorateExam(exam: Exam): Promise<Exam> {
    const creator = exam.creatorId ? await this.userRepository.getUser(exam.creatorId.toString()) : null
    return Object.assign(exam, { creator: creator ?? undefined, userSlug: creator?.slug || exam.creatorId?.toString() })
  }

  private async decorateExams(exams: Exam[]): Promise<Exam[]> {
    return Promise.all(exams.map((exam) => this.decorateExam(exam)))
  }

  public async getExam(id: ObjectId | string, user?: User): Promise<Exam> {
    const value = id.toString()
    if (typeof id === 'string' && isObjectId(id)) this.validator.validateId(id)

    const exam = await this.examRepository.getExam(value)
    if (!exam || (exam.ownerId && !(await this.canViewUnapproved(user)))) {
      throw new ExamNotFoundError(id)
    }
    return this.decorateExam(exam)
  }

  public async getExams(size = 50, user?: User): Promise<Exam[]> {
    const exams = await this.examRepository.getExams(size)
    const visibleExams = (await this.canViewUnapproved(user)) ? exams : exams.filter((exam) => !exam.ownerId)
    return this.decorateExams(visibleExams)
  }

  public async getPopularExams(size = 50, user?: User): Promise<Exam[]> {
    return this.getExams(size, user)
  }

  public async getExamList(filters: Record<string, unknown> = {}, user?: User): Promise<Record<string, unknown>> {
    const page = typeof filters.page === 'number' ? Math.max(1, filters.page) : 1
    const size = typeof filters.size === 'number' ? Math.min(50, Math.max(1, filters.size)) : 20
    const exams = await this.getExams(page * size + 1, user)
    return { data: exams.slice((page - 1) * size, page * size), page, size, hasNext: exams.length > page * size }
  }
}
