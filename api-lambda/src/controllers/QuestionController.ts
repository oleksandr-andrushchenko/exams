import { Inject, Service } from 'typedi'
import User from '../entities/user/User'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import Question from '../entities/question/Question'
import QuestionProvider from '../services/question/QuestionProvider'
import GetQuestion from '../schema/question/GetQuestion'
import GetQuestions from '../schema/question/GetQuestions'
import CreateQuestion from '../schema/question/CreateQuestion'
import UpdateQuestion from '../schema/question/UpdateQuestion'
import PaginatedQuestions from '../schema/question/PaginatedQuestions'
import Exam from '../entities/exam/Exam'
import ExamProvider from '../services/exam/ExamProvider'
import QuestionDeleter from '../services/question/QuestionDeleter'
import QuestionCreator from '../services/question/QuestionCreator'
import QuestionUpdater from '../services/question/QuestionUpdater'
import QuestionListProvider from '../services/question/QuestionListProvider'
import QuestionApproveSwitcher from '../services/question/QuestionApproveSwitcher'
import RateQuestionRequest from '../schema/question/RateQuestionRequest'
import QuestionRatingMarkCreator from '../services/question/QuestionRatingMarkCreator'
import RatingSchema from '../schema/rating/RatingSchema'
import QuestionRatingProvider from '../services/question/QuestionRatingProvider'

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
    @Inject() private readonly questionRatingProvider: QuestionRatingProvider
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
}
