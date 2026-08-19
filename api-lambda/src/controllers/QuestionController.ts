import { Inject, Service } from 'typedi'
import User from '../../../shared/src/entities/user/User'
import ValidatorInterface from '../../../shared/src/services/validator/ValidatorInterface'
import Question from '../../../shared/src/entities/question/Question'
import QuestionProvider from '../../../shared/src/services/question/QuestionProvider'
import GetQuestion from '../../../shared/src/schema/question/GetQuestion'
import GetQuestions from '../../../shared/src/schema/question/GetQuestions'
import CreateQuestion from '../../../shared/src/schema/question/CreateQuestion'
import UpdateQuestion from '../../../shared/src/schema/question/UpdateQuestion'
import PaginatedQuestions from '../../../shared/src/schema/question/PaginatedQuestions'
import Exam from '../../../shared/src/entities/exam/Exam'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import QuestionDeleter from '../../../shared/src/services/question/QuestionDeleter'
import QuestionCreator from '../../../shared/src/services/question/QuestionCreator'
import QuestionUpdater from '../../../shared/src/services/question/QuestionUpdater'
import QuestionListProvider from '../../../shared/src/services/question/QuestionListProvider'
import QuestionApproveSwitcher from '../../../shared/src/services/question/QuestionApproveSwitcher'
import RateQuestionRequest from '../../../shared/src/schema/question/RateQuestionRequest'
import QuestionRatingMarkCreator from '../../../shared/src/services/question/QuestionRatingMarkCreator'
import RatingSchema from '../../../shared/src/schema/rating/RatingSchema'
import QuestionRatingProvider from '../../../shared/src/services/question/QuestionRatingProvider'
import { type Request, type Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { queryObject } from '../../../shared/src/http'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'

@Service()
export class QuestionController {
  public constructor(
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly questionListProvider: QuestionListProvider,
    @Inject() private readonly questionCreator: QuestionCreator,
    @Inject() private readonly questionUpdater: QuestionUpdater,
    @Inject() private readonly questionDeleter: QuestionDeleter,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly questionApproveSwitcher: QuestionApproveSwitcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly questionRatingMarkCreator: QuestionRatingMarkCreator,
    @Inject() private readonly questionRatingProvider: QuestionRatingProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider
  ) {}

  public async getQuestion(getQuestion: GetQuestion): Promise<Question> {
    await this.validator.validate(getQuestion)

    return await this.questionProvider.getQuestion(getQuestion.questionId)
  }

  public async getQuestions(getQuestions: GetQuestions, user: User): Promise<Question[]> {
    return (await this.questionListProvider.getQuestions(getQuestions, false, user)) as Question[]
  }

  public async getPaginatedQuestions(getQuestions: GetQuestions, user: User): Promise<PaginatedQuestions> {
    return (await this.questionListProvider.getQuestions(getQuestions, true, user)) as PaginatedQuestions
  }

  public async createQuestion(question: CreateQuestion, user: User): Promise<Question> {
    return await this.questionCreator.createQuestion(question, user)
  }

  public async updateQuestion(getQuestion: GetQuestion, updateQuestion: UpdateQuestion, user: User): Promise<Question> {
    await this.validator.validate(getQuestion)
    const question = await this.questionProvider.getQuestion(getQuestion.questionId)

    return await this.questionUpdater.updateQuestion(question, updateQuestion, user)
  }

  public async deleteQuestion(getQuestion: GetQuestion, user: User): Promise<boolean> {
    await this.validator.validate(getQuestion)
    const question = await this.questionProvider.getQuestion(getQuestion.questionId)

    await this.questionDeleter.deleteQuestion(question, user)

    return true
  }

  public async toggleQuestionApprove(getQuestion: GetQuestion, user: User): Promise<Question> {
    await this.validator.validate(getQuestion)
    const question = await this.questionProvider.getQuestion(getQuestion.questionId)

    await this.questionApproveSwitcher.toggleQuestionApprove(question, user)

    return question
  }

  public async getQuestionExam(question: Question): Promise<Exam> {
    return await this.examProvider.getExam(question.examId)
  }

  public async getIsAuthorizedUserQuestionOwner(question: Question, user: User): Promise<boolean> {
    return user && user.id.toString() === question?.ownerId?.toString()
  }

  public async getIsAuthorizedUserQuestionCreator(question: Question, user: User): Promise<boolean> {
    return user && user.id.toString() === question.creatorId.toString()
  }

  public async rateQuestion(rateQuestionRequest: RateQuestionRequest, user: User): Promise<Question> {
    await this.validator.validate(rateQuestionRequest)
    const question = await this.questionProvider.getQuestion(rateQuestionRequest.questionId)

    await this.questionRatingMarkCreator.createQuestionRatingMark(question, rateQuestionRequest.mark, user)

    return question
  }

  public async getQuestionRating(question: Question, user: User): Promise<RatingSchema> {
    return this.questionRatingProvider.getQuestionRating(question, user)
  }

  public async getQuestionsRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.getQuestions(
        plainToInstance(GetQuestions, queryObject(request.query)),
        await this.authUserProvider.getAuthUser(request)
      )
    )
  }

  public async getQuestionRoute(request: Request, response: Response): Promise<void> {
    response.json(await this.getQuestion(plainToInstance(GetQuestion, { questionId: request.params.questionId })))
  }

  public async createQuestionRoute(request: Request, response: Response): Promise<void> {
    response
      .status(201)
      .json(
        await this.createQuestion(
          plainToInstance(CreateQuestion, request.body),
          await this.authUserProvider.getRequiredAuthUser(request)
        )
      )
  }

  public async updateQuestionRoute(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    response.json(
      await this.updateQuestion(
        plainToInstance(GetQuestion, { questionId: request.params.questionId }),
        plainToInstance(UpdateQuestion, request.body),
        user
      )
    )
  }

  public async deleteQuestionRoute(request: Request, response: Response): Promise<void> {
    response.json({
      deleted: await this.deleteQuestion(
        plainToInstance(GetQuestion, { questionId: request.params.questionId }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    })
  }

  public async approveQuestionRoute(request: Request, response: Response): Promise<void> {
    response.json(
      await this.toggleQuestionApprove(
        plainToInstance(GetQuestion, { questionId: request.params.questionId }),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }

  public async rateQuestionRoute(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const question = await this.rateQuestion(
      plainToInstance(RateQuestionRequest, { questionId: request.params.questionId, mark: request.body.mark }),
      user
    )
    const rating = await this.getQuestionRating(question, user)
    response.json({ id: question.id.toString(), html: rating?.html })
  }
}
