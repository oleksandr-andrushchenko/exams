import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import User from '../entities/user/User'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import Question from '../entities/question/Question'
import QuestionProvider from '../services/question/QuestionProvider'
import GetQuestion from '../schema/question/GetQuestion'
import GetQuestions from '../schema/question/GetQuestions'
import CreateQuestion from '../schema/question/CreateQuestion'
import UpdateQuestion from '../schema/question/UpdateQuestion'
import PaginatedQuestions from '../schema/question/PaginatedQuestions'
import Category from '../entities/category/Category'
import CategoryProvider from '../services/category/CategoryProvider'
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
@Resolver(Question)
export class QuestionResolver {

  public constructor(
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly questionListProvider: QuestionListProvider,
    @Inject() private readonly questionCreator: QuestionCreator,
    @Inject() private readonly questionUpdater: QuestionUpdater,
    @Inject() private readonly questionDeleter: QuestionDeleter,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly questionApproveSwitcher: QuestionApproveSwitcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly questionRatingMarkCreator: QuestionRatingMarkCreator,
    @Inject() private readonly questionRatingProvider: QuestionRatingProvider,
  ) {
  }

  @Query(_returns => Question, { name: 'question' })
  public async getQuestion(
    @Args() getQuestion: GetQuestion,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)

    return await this.questionProvider.getQuestion(getQuestion.questionId)
  }

  @Query(_returns => [ Question ], { name: 'questions' })
  public async getQuestions(
    @Args() getQuestions: GetQuestions,
    @Ctx('user') user: User,
  ): Promise<Question[]> {
    return await this.questionListProvider.getQuestions(getQuestions, false, user) as Question[]
  }

  @Query(_returns => PaginatedQuestions, { name: 'paginatedQuestions' })
  public async getPaginatedQuestions(
    @Args() getQuestions: GetQuestions,
    @Ctx('user') user: User,
  ): Promise<PaginatedQuestions> {
    return await this.questionListProvider.getQuestions(getQuestions, true, user) as PaginatedQuestions
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async createQuestion(
    @Arg('createQuestion') question: CreateQuestion,
    @Ctx('user') user: User,
  ): Promise<Question> {
    return await this.questionCreator.createQuestion(question, user)
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async updateQuestion(
    @Args() getQuestion: GetQuestion,
    @Arg('updateQuestion') updateQuestion: UpdateQuestion,
    @Ctx('user') user: User,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)
    const question = await this.questionProvider.getQuestion(getQuestion.questionId)

    return await this.questionUpdater.updateQuestion(question, updateQuestion, user)
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteQuestion(
    @Args() getQuestion: GetQuestion,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getQuestion)
    const question = await this.questionProvider.getQuestion(getQuestion.questionId)

    await this.questionDeleter.deleteQuestion(question, user)

    return true
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async toggleQuestionApprove(
    @Args() getQuestion: GetQuestion,
    @Ctx('user') user: User,
  ): Promise<Question> {
    await this.validator.validate(getQuestion)
    const question = await this.questionProvider.getQuestion(getQuestion.questionId)

    await this.questionApproveSwitcher.toggleQuestionApprove(question, user)

    return question
  }

  @FieldResolver(_returns => Category, { name: 'category' })
  public async getQuestionCategory(
    @Root() question: Question,
  ): Promise<Category> {
    return await this.categoryProvider.getCategory(question.categoryId)
  }

  @Authorized()
  @FieldResolver(_returns => Boolean, { name: 'isOwner', nullable: true })
  public async getIsAuthorizedUserQuestionOwner(
    @Root() question: Question,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    return user && user.id.toString() === question?.ownerId?.toString()
  }

  @Authorized()
  @FieldResolver(_returns => Boolean, { name: 'isCreator', nullable: true })
  public async getIsAuthorizedUserQuestionCreator(
    @Root() question: Question,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    return user && user.id.toString() === question.creatorId.toString()
  }

  @Authorized()
  @Mutation(_returns => Question)
  public async rateQuestion(
    @Args() rateQuestionRequest: RateQuestionRequest,
    @Ctx('user') user: User,
  ): Promise<Question> {
    await this.validator.validate(rateQuestionRequest)
    const question = await this.questionProvider.getQuestion(rateQuestionRequest.questionId)

    await this.questionRatingMarkCreator.createQuestionRatingMark(question, rateQuestionRequest.mark, user)

    return question
  }

  @FieldResolver(_returns => RatingSchema, { name: 'rating', nullable: true })
  public async getQuestionRating(
    @Root() question: Question,
    @Ctx('user') user: User,
  ): Promise<RatingSchema> {
    return this.questionRatingProvider.getQuestionRating(question, user)
  }
}