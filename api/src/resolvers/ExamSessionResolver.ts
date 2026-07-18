import { Inject, Service } from 'typedi'
import ExamSession from '../entities/examSession/ExamSession'
import User from '../entities/user/User'
import CreateExamSession from '../schema/examSession/CreateExamSession'
import ExamSessionProvider from '../services/examSession/ExamSessionProvider'
import GetExamSession from '../schema/examSession/GetExamSession'
import ExamSessionQuestionSchema from '../schema/examSession/ExamSessionQuestionSchema'
import CreateExamSessionQuestionAnswer from '../schema/examSession/CreateExamSessionQuestionAnswer'
import GetExamSessionQuestion from '../schema/examSession/GetExamSessionQuestion'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetExamSessions from '../schema/examSession/GetExamSessions'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import PaginatedExamSessions from '../schema/examSession/PaginatedExamSessions'
import Exam from '../entities/exam/Exam'
import ExamProvider from '../services/exam/ExamProvider'
import ExamSessionCreator from '../services/examSession/ExamSessionCreator'
import ExamSessionDeleter from '../services/examSession/ExamSessionDeleter'
import ExamSessionQuestionAnswerDeleter from '../services/examSession/ExamSessionQuestionAnswerDeleter'
import ExamSessionQuestionAnswerCreator from '../services/examSession/ExamSessionQuestionAnswerCreator'
import ExamSessionCompletionCreator from '../services/examSession/ExamSessionCompletionCreator'
import ExamSessionLastRequestedQuestionNumberSetter from '../services/examSession/ExamSessionLastRequestedQuestionNumberSetter'
import ExamSessionQuestionProvider from '../services/examSession/ExamSessionQuestionProvider'
import ExamSessionListProvider from '../services/examSession/ExamSessionListProvider'
import GetCurrentExamSessions from '../schema/examSession/GetCurrentExamSessions'
import CurrentExamSessionListProvider from '../services/examSession/CurrentExamSessionListProvider'
import ExamListProvider from '../services/exam/ExamListProvider'

@Service()
@Resolver(ExamSession)
export class ExamSessionResolver {

  public constructor(
    @Inject() private readonly examSessionCreator: ExamSessionCreator,
    @Inject() private readonly examSessionDeleter: ExamSessionDeleter,
    @Inject() private readonly examSessionLastRequestedQuestionNumberSetter: ExamSessionLastRequestedQuestionNumberSetter,
    @Inject() private readonly examSessionQuestionAnswerCreator: ExamSessionQuestionAnswerCreator,
    @Inject() private readonly examSessionQuestionProvider: ExamSessionQuestionProvider,
    @Inject() private readonly examSessionQuestionAnswerDeleter: ExamSessionQuestionAnswerDeleter,
    @Inject() private readonly examSessionCompletionCreator: ExamSessionCompletionCreator,
    @Inject() private readonly examSessionProvider: ExamSessionProvider,
    @Inject() private readonly examSessionListProvider: ExamSessionListProvider,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly currentExamSessionListProvider: CurrentExamSessionListProvider,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly examListProvider: ExamListProvider,
  ) {
  }

  @Authorized()
  @Mutation(_returns => ExamSession)
  public async createExamSession(
    @Arg('createExamSession') examSession: CreateExamSession,
    @Ctx('user') user: User,
  ): Promise<ExamSession> {
    return await this.examSessionCreator.createExamSession(examSession, user)
  }

  @Authorized()
  @Query(_returns => [ ExamSession ], { name: 'examSessions' })
  public async getExamSessions(
    @Args() getExamSessions: GetExamSessions,
    @Ctx('user') user: User,
  ): Promise<ExamSession[]> {
    return await this.examSessionListProvider.getExamSessions(getExamSessions, user) as ExamSession[]
  }

  @Query(_returns => PaginatedExamSessions, { name: 'paginatedExamSessions' })
  public async getPaginatedExamSessions(
    @Args() getExamSessions: GetExamSessions,
    @Ctx('user') user: User,
  ): Promise<PaginatedExamSessions> {
    return await this.examSessionListProvider.getExamSessions(getExamSessions, user, true) as PaginatedExamSessions
  }

  @Authorized()
  @Query(_returns => ExamSession, { name: 'examSession' })
  public async getExamSession(
    @Args() getExamSession: GetExamSession,
    @Ctx('user') user: User,
  ): Promise<ExamSession> {
    await this.validator.validate(getExamSession)

    return await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)
  }

  @Authorized()
  @Query(_returns => ExamSessionQuestionSchema, { name: 'examSessionQuestion' })
  public async getExamSessionQuestion(
    @Args() getExamSessionQuestion: GetExamSessionQuestion,
    @Ctx('user') user: User,
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSessionQuestion)
    const examSession = await this.examSessionProvider.getExamSession(getExamSessionQuestion.examSessionId, user)

    const examSessionQuestion = await this.examSessionQuestionProvider.getExamSessionQuestion(examSession, getExamSessionQuestion.question, user)
    await this.examSessionLastRequestedQuestionNumberSetter.setExamSessionLastRequestedQuestionNumber(examSession, getExamSessionQuestion.question, user)

    return examSessionQuestion
  }

  @Authorized()
  @Query(_returns => ExamSessionQuestionSchema, { name: 'currentExamSessionQuestion' })
  public async getCurrentExamSessionQuestion(
    @Args() getExamSession: GetExamSession,
    @Ctx('user') user: User,
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSession)
    const examSession = await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)

    return await this.examSessionQuestionProvider.getExamSessionQuestion(examSession, examSession.questionNumber, user)
  }

  @Authorized()
  @Mutation(_returns => ExamSessionQuestionSchema)
  public async createExamSessionQuestionAnswer(
    @Args() getExamSessionQuestion: GetExamSessionQuestion,
    @Arg('createExamSessionQuestionAnswer') createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer,
    @Ctx('user') user: User,
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSessionQuestion)
    const examSession = await this.examSessionProvider.getExamSession(getExamSessionQuestion.examSessionId, user)

    await this.examSessionQuestionAnswerCreator.createExamSessionQuestionAnswer(examSession, getExamSessionQuestion.question, createExamSessionQuestionAnswer, user)

    return this.examSessionQuestionProvider.getExamSessionQuestion(examSession, getExamSessionQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => ExamSessionQuestionSchema)
  public async deleteExamSessionQuestionAnswer(
    @Args() getExamSessionQuestion: GetExamSessionQuestion,
    @Ctx('user') user: User,
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSessionQuestion)
    const examSession = await this.examSessionProvider.getExamSession(getExamSessionQuestion.examSessionId, user)

    await this.examSessionQuestionAnswerDeleter.deleteExamSessionQuestionAnswer(examSession, getExamSessionQuestion.question, user)

    return this.examSessionQuestionProvider.getExamSessionQuestion(examSession, getExamSessionQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => ExamSession)
  public async createExamSessionCompletion(
    @Args() getExamSession: GetExamSession,
    @Ctx('user') user: User,
  ): Promise<ExamSession> {
    await this.validator.validate(getExamSession)
    const examSession = await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)

    await this.examSessionCompletionCreator.createExamSessionCompletion(examSession, user)

    return examSession
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteExamSession(
    @Args() getExamSession: GetExamSession,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getExamSession)
    const examSession = await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)

    await this.examSessionDeleter.deleteExamSession(examSession, user)

    return true
  }

  @FieldResolver(_returns => Exam, { name: 'exam' })
  public async getExamSessionExam(
    @Root() examSession: ExamSession,
  ): Promise<Exam> {
    return await this.examProvider.getExam(examSession.examId)
  }

  @Authorized()
  @Query(_returns => [ ExamSession ], { name: 'currentExamSessions' })
  public async getCurrentExamSessions(
    @Args() getCurrentExamSessions: GetCurrentExamSessions,
    @Ctx('user') user: User,
  ): Promise<ExamSession[]> {
    await this.validator.validate(getCurrentExamSessions)
    const exams = await this.examListProvider.getExamsByIds(getCurrentExamSessions.examIds)

    return await this.currentExamSessionListProvider.getCurrentExamSessions(exams, user)
  }
}