import { Inject, Service } from 'typedi'
import ExamProvider from '../services/exam/ExamProvider'
import Exam from '../entities/exam/Exam'
import GetExams from '../schema/exam/GetExams'
import GetExam from '../schema/exam/GetExam'
import CreateExam from '../schema/exam/CreateExam'
import User from '../entities/user/User'
import UpdateExam from '../schema/exam/UpdateExam'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import PaginatedExams from '../schema/exam/PaginatedExams'
import ExamDeleter from '../services/exam/ExamDeleter'
import ExamCreator from '../services/exam/ExamCreator'
import ExamUpdater from '../services/exam/ExamUpdater'
import ExamListProvider from '../services/exam/ExamListProvider'
import ExamApproveSwitcher from '../services/exam/ExamApproveSwitcher'
import ExamRepository from '../repositories/exam/ExamRepository'
import RatingSchema from '../schema/rating/RatingSchema'
import ExamRatingProvider from '../services/exam/ExamRatingProvider'
import { ObjectId } from 'bson'
import ExamExamSessionIdProvider from '../services/exam/ExamExamSessionIdProvider'
import ExamTag from '../entities/examTag/ExamTag'
import ExamTagRepository from '../repositories/examTag/ExamTagRepository'

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
    @Inject() private readonly examTagRepository: ExamTagRepository
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

  public async createExam(createExam: CreateExam, user: User): Promise<Exam> {
    return await this.examCreator.createExam(createExam, user)
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
}
