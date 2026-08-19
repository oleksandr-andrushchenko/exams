import { Inject, Service } from 'typedi'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import Exam from '../../../shared/src/entities/exam/Exam'
import GetExams from '../../../shared/src/schema/exam/GetExams'
import GetExam from '../../../shared/src/schema/exam/GetExam'
import CreateExam from '../../../shared/src/schema/exam/CreateExam'
import User from '../../../shared/src/entities/user/User'
import UpdateExam from '../../../shared/src/schema/exam/UpdateExam'
import ValidatorInterface from '../../../shared/src/services/validator/ValidatorInterface'
import PaginatedExams from '../../../shared/src/schema/exam/PaginatedExams'
import ExamDeleter from '../../../shared/src/services/exam/ExamDeleter'
import ExamCreator from '../../../shared/src/services/exam/ExamCreator'
import ExamUpdater from '../../../shared/src/services/exam/ExamUpdater'
import ExamListProvider from '../../../shared/src/services/exam/ExamListProvider'
import ExamApproveSwitcher from '../../../shared/src/services/exam/ExamApproveSwitcher'
import ExamRepository from '../../../shared/src/repositories/exams/ExamRepository'
import RatingSchema from '../../../shared/src/schema/rating/RatingSchema'
import ExamRatingProvider from '../../../shared/src/services/exam/ExamRatingProvider'
import { ObjectId } from 'bson'
import ExamExamSessionIdProvider from '../../../shared/src/services/exam/ExamExamSessionIdProvider'
import ExamTag from '../../../shared/src/entities/examTag/ExamTag'
import ExamTagRepository from '../../../shared/src/repositories/exams/ExamTagRepository'
import { plainToInstance } from 'class-transformer'
import { type Request, type Response } from 'express'

import { queryObject } from '../../../shared/src/http'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'

@Service()
export class ExamController {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly examListProvider: ExamListProvider,
    @Inject() private readonly examCreator: ExamCreator,
    @Inject() private readonly examUpdater: ExamUpdater,
    @Inject() private readonly examDeleter: ExamDeleter,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly examApproveSwitcher: ExamApproveSwitcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly examRatingProvider: ExamRatingProvider,
    @Inject() private readonly examExamSessionIdProvider: ExamExamSessionIdProvider,
    @Inject() private readonly examTagRepository: ExamTagRepository,
    @Inject() private readonly authUserProvider: AuthUserProvider
  ) {}

  public async getExam(getExam: GetExam): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examProvider.getExam(getExam.examId)
  }

  public async getExams(getExams: GetExams, user: User): Promise<Exam[]> {
    return (await this.examListProvider.getExams(getExams, false, user)) as Exam[]
  }

  public async getPaginatedExams(getExams: GetExams, user: User): Promise<PaginatedExams> {
    return (await this.examListProvider.getExams(getExams, true, user)) as PaginatedExams
  }

  public async createExam(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    if (!user) {
      response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
      return
    }
    const exam = await this.examCreator.createExam(plainToInstance(CreateExam, request.body), user)
    response.status(201).json(await this.withExamTags(exam))
  }

  private async withExamTags(exam: Exam): Promise<Record<string, unknown>> {
    return {
      ...exam,
      tags: await Promise.all(
        (await this.getTags(exam)).map(async (tag) => ({
          ...tag,
          examsCount: await this.examTagRepository.countExams(tag)
        }))
      )
    }
  }

  public async getExamsRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.getExams(
        plainToInstance(GetExams, queryObject(request.query)),
        await this.authUserProvider.getAuthUser(request)
      )
    )
  }

  public async updateExam(getExam: GetExam, updateExam: UpdateExam, user: User): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId)

    return await this.examUpdater.updateExam(exam, updateExam, user)
  }

  public async toggleExamApprove(getExam: GetExam, user: User): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId)

    await this.examApproveSwitcher.toggleExamApprove(exam, user)

    return exam
  }

  public async deleteExam(getExam: GetExam, user: User): Promise<boolean> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId)

    await this.examDeleter.deleteExam(exam, user)

    return true
  }

  public async getIsAuthorizedUserExamOwner(exam: Exam, user: User): Promise<boolean> {
    return user && user.id.toString() === exam?.ownerId?.toString()
  }

  public async getIsAuthorizedUserExamCreator(exam: Exam, user: User): Promise<boolean> {
    return user && user.id.toString() === exam.creatorId.toString()
  }

  public async getExamRating(exam: Exam, user: User): Promise<RatingSchema> {
    return this.examRatingProvider.getExamRating(exam, user)
  }

  public getTags(exam: Exam): Promise<ExamTag[]> {
    return this.examTagRepository.findForExam(exam)
  }

  public async getAuthorizedUserExamExamSessionId(exam: Exam, user: User): Promise<ObjectId> {
    return this.examExamSessionIdProvider.getExamExamSessionId(exam, user)
  }

  public async getExamRoute(request: Request, response: Response): Promise<void> {
    response.json(await this.getExam(plainToInstance(GetExam, { examId: request.params.examId })))
  }

  public async updateExamRoute(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const exam = await this.updateExam(
      plainToInstance(GetExam, { examId: request.params.examId }),
      plainToInstance(UpdateExam, request.body),
      user
    )
    response.json(await this.withExamTags(exam))
  }

  public async deleteExamRoute(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    response.json({ deleted: await this.deleteExam(plainToInstance(GetExam, { examId: request.params.examId }), user) })
  }

  public async approveExamRoute(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    response.json(await this.toggleExamApprove(plainToInstance(GetExam, { examId: request.params.examId }), user))
  }

  public async rateExamRoute(_request: Request, response: Response): Promise<void> {
    response.status(404).json({ error: { status: 404, message: 'Exam rating is not available' } })
  }
}
