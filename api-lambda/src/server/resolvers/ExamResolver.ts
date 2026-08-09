import { Inject, Service } from 'typedi'
import ExamProvider from '../services/exam/ExamProvider'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
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
@Resolver(Exam)
export class ExamResolver {
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

  @Query((_returns) => Exam, { name: 'exam' })
  public async getExam(@Args() getExam: GetExam): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examProvider.getExam(getExam.examId)
  }

  @Query((_returns) => [Exam], { name: 'exams' })
  public async getExams(@Args() getExams: GetExams, @Ctx('user') user: User): Promise<Exam[]> {
    return (await this.examListProvider.getExams(getExams, false, user)) as Exam[]
  }

  @Query((_returns) => PaginatedExams, { name: 'paginatedExams' })
  public async getPaginatedExams(@Args() getExams: GetExams, @Ctx('user') user: User): Promise<PaginatedExams> {
    return (await this.examListProvider.getExams(getExams, true, user)) as PaginatedExams
  }

  @Authorized()
  @Mutation((_returns) => Exam)
  public async createExam(@Arg('createExam') createExam: CreateExam, @Ctx('user') user: User): Promise<Exam> {
    return await this.examCreator.createExam(createExam, user)
  }

  @Authorized()
  @Mutation((_returns) => Exam)
  public async updateExam(
    @Args() getExam: GetExam,
    @Arg('updateExam') updateExam: UpdateExam,
    @Ctx('user') user: User
  ): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId)

    return await this.examUpdater.updateExam(exam, updateExam, user)
  }

  @Authorized()
  @Mutation((_returns) => Exam)
  public async toggleExamApprove(@Args() getExam: GetExam, @Ctx('user') user: User): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId)

    await this.examApproveSwitcher.toggleExamApprove(exam, user)

    return exam
  }

  @Authorized()
  @Mutation((_returns) => Boolean)
  public async deleteExam(@Args() getExam: GetExam, @Ctx('user') user: User): Promise<boolean> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId)

    await this.examDeleter.deleteExam(exam, user)

    return true
  }

  @Authorized()
  @FieldResolver((_returns) => Boolean, { name: 'isOwner', nullable: true })
  public async getIsAuthorizedUserExamOwner(@Root() exam: Exam, @Ctx('user') user: User): Promise<boolean> {
    return user && user.id.toString() === exam?.ownerId?.toString()
  }

  @Authorized()
  @FieldResolver((_returns) => Boolean, { name: 'isCreator', nullable: true })
  public async getIsAuthorizedUserExamCreator(@Root() exam: Exam, @Ctx('user') user: User): Promise<boolean> {
    return user && user.id.toString() === exam.creatorId.toString()
  }

  @FieldResolver((_returns) => RatingSchema, { name: 'rating', nullable: true })
  public async getExamRating(@Root() exam: Exam, @Ctx('user') user: User): Promise<RatingSchema> {
    return this.examRatingProvider.getExamRating(exam, user)
  }

  @FieldResolver((_returns) => [ExamTag], { name: 'tags' })
  public getTags(@Root() exam: Exam): Promise<ExamTag[]> {
    return this.examTagRepository.findForExam(exam)
  }

  @Authorized()
  @FieldResolver((_returns) => ObjectId, { name: 'examSessionId', nullable: true })
  public async getAuthorizedUserExamExamSessionId(@Root() exam: Exam, @Ctx('user') user: User): Promise<ObjectId> {
    return this.examExamSessionIdProvider.getExamExamSessionId(exam, user)
  }
}
