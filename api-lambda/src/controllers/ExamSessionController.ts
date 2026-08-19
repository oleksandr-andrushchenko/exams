import { Inject, Service } from 'typedi'
import ExamSession from '../../../shared/src/entities/examSession/ExamSession'
import User from '../../../shared/src/entities/user/User'
import CreateExamSession from '../../../shared/src/schema/examSession/CreateExamSession'
import ExamSessionProvider from '../../../shared/src/services/examSession/ExamSessionProvider'
import GetExamSession from '../../../shared/src/schema/examSession/GetExamSession'
import ExamSessionQuestionSchema from '../../../shared/src/schema/examSession/ExamSessionQuestionSchema'
import CreateExamSessionQuestionAnswer from '../../../shared/src/schema/examSession/CreateExamSessionQuestionAnswer'
import GetExamSessionQuestion from '../../../shared/src/schema/examSession/GetExamSessionQuestion'
import ValidatorInterface from '../../../shared/src/services/validator/ValidatorInterface'
import GetExamSessions from '../../../shared/src/schema/examSession/GetExamSessions'
import PaginatedExamSessions from '../../../shared/src/schema/examSession/PaginatedExamSessions'
import Exam from '../../../shared/src/entities/exam/Exam'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import ExamSessionCreator from '../../../shared/src/services/examSession/ExamSessionCreator'
import ExamSessionDeleter from '../../../shared/src/services/examSession/ExamSessionDeleter'
import ExamSessionQuestionAnswerDeleter from '../../../shared/src/services/examSession/ExamSessionQuestionAnswerDeleter'
import ExamSessionQuestionAnswerCreator from '../../../shared/src/services/examSession/ExamSessionQuestionAnswerCreator'
import ExamSessionCompletionCreator from '../../../shared/src/services/examSession/ExamSessionCompletionCreator'
import ExamSessionLastRequestedQuestionNumberSetter from '../../../shared/src/services/examSession/ExamSessionLastRequestedQuestionNumberSetter'
import ExamSessionQuestionProvider from '../../../shared/src/services/examSession/ExamSessionQuestionProvider'
import ExamSessionListProvider from '../../../shared/src/services/examSession/ExamSessionListProvider'
import GetCurrentExamSessions from '../../../shared/src/schema/examSession/GetCurrentExamSessions'
import CurrentExamSessionListProvider from '../../../shared/src/services/examSession/CurrentExamSessionListProvider'
import ExamListProvider from '../../../shared/src/services/exam/ExamListProvider'
import { type Request, type Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { queryObject } from '../../../shared/src/http'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'

@Service()
export class ExamSessionController {
  public constructor(
    @Inject() private readonly examSessionCreator: ExamSessionCreator,
    @Inject() private readonly examSessionDeleter: ExamSessionDeleter,
    @Inject()
    private readonly examSessionLastRequestedQuestionNumberSetter: ExamSessionLastRequestedQuestionNumberSetter,
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
    @Inject() private readonly authUserProvider: AuthUserProvider
  ) {}

  public async createExamSession(examSession: CreateExamSession, user: User): Promise<ExamSession> {
    return await this.examSessionCreator.createExamSession(examSession, user)
  }

  public async getExamSessions(getExamSessions: GetExamSessions, user: User): Promise<ExamSession[]> {
    return (await this.examSessionListProvider.getExamSessions(getExamSessions, user)) as ExamSession[]
  }

  public async getUserExamSessions(getExamSessions: GetExamSessions): Promise<ExamSession[]> {
    if (!getExamSessions.userId) return []
    return (await this.examSessionListProvider.getExamSessions(getExamSessions, undefined, false)) as ExamSession[]
  }

  public async getPaginatedExamSessions(getExamSessions: GetExamSessions, user: User): Promise<PaginatedExamSessions> {
    return (await this.examSessionListProvider.getExamSessions(getExamSessions, user, true)) as PaginatedExamSessions
  }

  public async getExamSession(getExamSession: GetExamSession, user: User): Promise<ExamSession> {
    await this.validator.validate(getExamSession)

    return await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)
  }

  public async getExamSessionQuestion(
    getExamSessionQuestion: GetExamSessionQuestion,
    user: User
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSessionQuestion)
    const examSession = await this.examSessionProvider.getExamSession(getExamSessionQuestion.examSessionId, user)

    const examSessionQuestion = await this.examSessionQuestionProvider.getExamSessionQuestion(
      examSession,
      getExamSessionQuestion.question,
      user
    )
    await this.examSessionLastRequestedQuestionNumberSetter.setExamSessionLastRequestedQuestionNumber(
      examSession,
      getExamSessionQuestion.question,
      user
    )

    return examSessionQuestion
  }

  public async getCurrentExamSessionQuestion(
    getExamSession: GetExamSession,
    user: User
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSession)
    const examSession = await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)

    return await this.examSessionQuestionProvider.getExamSessionQuestion(examSession, examSession.questionNumber, user)
  }

  public async createExamSessionQuestionAnswer(
    getExamSessionQuestion: GetExamSessionQuestion,
    createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer,
    user: User
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSessionQuestion)
    const examSession = await this.examSessionProvider.getExamSession(getExamSessionQuestion.examSessionId, user)

    await this.examSessionQuestionAnswerCreator.createExamSessionQuestionAnswer(
      examSession,
      getExamSessionQuestion.question,
      createExamSessionQuestionAnswer,
      user
    )

    return this.examSessionQuestionProvider.getExamSessionQuestion(examSession, getExamSessionQuestion.question, user)
  }

  public async deleteExamSessionQuestionAnswer(
    getExamSessionQuestion: GetExamSessionQuestion,
    user: User
  ): Promise<ExamSessionQuestionSchema> {
    await this.validator.validate(getExamSessionQuestion)
    const examSession = await this.examSessionProvider.getExamSession(getExamSessionQuestion.examSessionId, user)

    await this.examSessionQuestionAnswerDeleter.deleteExamSessionQuestionAnswer(
      examSession,
      getExamSessionQuestion.question,
      user
    )

    return this.examSessionQuestionProvider.getExamSessionQuestion(examSession, getExamSessionQuestion.question, user)
  }

  public async createExamSessionCompletion(getExamSession: GetExamSession, user: User): Promise<ExamSession> {
    await this.validator.validate(getExamSession)
    const examSession = await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)

    await this.examSessionCompletionCreator.createExamSessionCompletion(examSession, user)

    return examSession
  }

  public async deleteExamSession(getExamSession: GetExamSession, user: User): Promise<boolean> {
    await this.validator.validate(getExamSession)
    const examSession = await this.examSessionProvider.getExamSession(getExamSession.examSessionId, user)

    await this.examSessionDeleter.deleteExamSession(examSession, user)

    return true
  }

  public async getExamSessionExam(examSession: ExamSession): Promise<Exam> {
    return await this.examProvider.getExam(examSession.examId)
  }

  public async getCurrentExamSessions(
    getCurrentExamSessions: GetCurrentExamSessions,
    user: User
  ): Promise<ExamSession[]> {
    await this.validator.validate(getCurrentExamSessions)
    const exams = await this.examListProvider.getExamsByIds(getCurrentExamSessions.examIds)

    return await this.currentExamSessionListProvider.getCurrentExamSessions(exams, user)
  }

  public async createRoute(request: Request, response: Response): Promise<void> {
    response
      .status(201)
      .json(
        await this.createExamSession(
          plainToInstance(CreateExamSession, request.body),
          await this.authUserProvider.getRequiredAuthUser(request)
        )
      )
  }
  public async listRoute(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const { meta, ...query } = queryObject(request.query)
    const data = plainToInstance(GetExamSessions, query)
    response.json(await (meta ? this.getPaginatedExamSessions(data, user) : this.getExamSessions(data, user)))
  }
  public async currentRoute(request: Request, response: Response): Promise<void> {
    const examIds = Array.isArray(request.query.examIds)
      ? request.query.examIds
      : String(request.query.examIds ?? '').split(',')
    response.json(
      await this.getCurrentExamSessions(
        plainToInstance(GetCurrentExamSessions, { examIds }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }
  public async completionRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.createExamSessionCompletion(
        plainToInstance(GetExamSession, { examSessionId: request.params.examSessionId }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }
  public async deleteRoute(request: Request, response: Response): Promise<void> {
    response.json({
      deleted: await this.deleteExamSession(
        plainToInstance(GetExamSession, { examSessionId: request.params.examSessionId }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    })
  }
  public async answerDeleteRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.deleteExamSessionQuestionAnswer(
        plainToInstance(GetExamSessionQuestion, {
          examSessionId: request.params.examSessionId,
          question: Number(request.params.question)
        }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }
  public async getRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.getExamSession(
        plainToInstance(GetExamSession, { examSessionId: request.params.examSessionId }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }
  public async questionRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.getExamSessionQuestion(
        plainToInstance(GetExamSessionQuestion, {
          examSessionId: request.params.examSessionId,
          question: Number(request.params.question)
        }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }
  public async answerRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.createExamSessionQuestionAnswer(
        plainToInstance(GetExamSessionQuestion, {
          examSessionId: request.params.examSessionId,
          question: Number(request.params.question)
        }),
        plainToInstance(CreateExamSessionQuestionAnswer, request.body),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }
}
