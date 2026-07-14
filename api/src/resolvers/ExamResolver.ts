import { Inject, Service } from 'typedi'
import Exam from '../entities/exam/Exam'
import User from '../entities/user/User'
import CreateExam from '../schema/exam/CreateExam'
import ExamProvider from '../services/exam/ExamProvider'
import GetExam from '../schema/exam/GetExam'
import ExamQuestionSchema from '../schema/exam/ExamQuestionSchema'
import CreateExamQuestionAnswer from '../schema/exam/CreateExamQuestionAnswer'
import GetExamQuestion from '../schema/exam/GetExamQuestion'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetExams from '../schema/exam/GetExams'
import { Arg, Args, Authorized, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql'
import PaginatedExams from '../schema/exam/PaginatedExams'
import Category from '../entities/category/Category'
import CategoryProvider from '../services/category/CategoryProvider'
import ExamCreator from '../services/exam/ExamCreator'
import ExamDeleter from '../services/exam/ExamDeleter'
import ExamQuestionAnswerDeleter from '../services/exam/ExamQuestionAnswerDeleter'
import ExamQuestionAnswerCreator from '../services/exam/ExamQuestionAnswerCreator'
import ExamCompletionCreator from '../services/exam/ExamCompletionCreator'
import ExamLastRequestedQuestionNumberSetter from '../services/exam/ExamLastRequestedQuestionNumberSetter'
import ExamQuestionProvider from '../services/exam/ExamQuestionProvider'
import ExamListProvider from '../services/exam/ExamListProvider'
import GetCurrentExams from '../schema/exam/GetCurrentExams'
import CurrentExamListProvider from '../services/exam/CurrentExamListProvider'
import CategoryListProvider from '../services/category/CategoryListProvider'

@Service()
@Resolver(Exam)
export class ExamResolver {

  public constructor(
    @Inject() private readonly examCreator: ExamCreator,
    @Inject() private readonly examDeleter: ExamDeleter,
    @Inject() private readonly examLastRequestedQuestionNumberSetter: ExamLastRequestedQuestionNumberSetter,
    @Inject() private readonly examQuestionAnswerCreator: ExamQuestionAnswerCreator,
    @Inject() private readonly examQuestionProvider: ExamQuestionProvider,
    @Inject() private readonly examQuestionAnswerDeleter: ExamQuestionAnswerDeleter,
    @Inject() private readonly examCompletionCreator: ExamCompletionCreator,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly examListProvider: ExamListProvider,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly currentExamListProvider: CurrentExamListProvider,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly categoryListProvider: CategoryListProvider,
  ) {
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async createExam(
    @Arg('createExam') exam: CreateExam,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    return await this.examCreator.createExam(exam, user)
  }

  @Authorized()
  @Query(_returns => [ Exam ], { name: 'exams' })
  public async getExams(
    @Args() getExams: GetExams,
    @Ctx('user') user: User,
  ): Promise<Exam[]> {
    return await this.examListProvider.getExams(getExams, user) as Exam[]
  }

  @Query(_returns => PaginatedExams, { name: 'paginatedExams' })
  public async getPaginatedExams(
    @Args() getExams: GetExams,
    @Ctx('user') user: User,
  ): Promise<PaginatedExams> {
    return await this.examListProvider.getExams(getExams, user, true) as PaginatedExams
  }

  @Authorized()
  @Query(_returns => Exam, { name: 'exam' })
  public async getExam(
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)

    return await this.examProvider.getExam(getExam.examId, user)
  }

  @Authorized()
  @Query(_returns => ExamQuestionSchema, { name: 'examQuestion' })
  public async getExamQuestion(
    @Args() getExamQuestion: GetExamQuestion,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examProvider.getExam(getExamQuestion.examId, user)

    const examQuestion = await this.examQuestionProvider.getExamQuestion(exam, getExamQuestion.question, user)
    await this.examLastRequestedQuestionNumberSetter.setExamLastRequestedQuestionNumber(exam, getExamQuestion.question, user)

    return examQuestion
  }

  @Authorized()
  @Query(_returns => ExamQuestionSchema, { name: 'currentExamQuestion' })
  public async getCurrentExamQuestion(
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId, user)

    return await this.examQuestionProvider.getExamQuestion(exam, exam.questionNumber, user)
  }

  @Authorized()
  @Mutation(_returns => ExamQuestionSchema)
  public async createExamQuestionAnswer(
    @Args() getExamQuestion: GetExamQuestion,
    @Arg('createExamQuestionAnswer') createExamQuestionAnswer: CreateExamQuestionAnswer,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examProvider.getExam(getExamQuestion.examId, user)

    await this.examQuestionAnswerCreator.createExamQuestionAnswer(exam, getExamQuestion.question, createExamQuestionAnswer, user)

    return this.examQuestionProvider.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => ExamQuestionSchema)
  public async deleteExamQuestionAnswer(
    @Args() getExamQuestion: GetExamQuestion,
    @Ctx('user') user: User,
  ): Promise<ExamQuestionSchema> {
    await this.validator.validate(getExamQuestion)
    const exam = await this.examProvider.getExam(getExamQuestion.examId, user)

    await this.examQuestionAnswerDeleter.deleteExamQuestionAnswer(exam, getExamQuestion.question, user)

    return this.examQuestionProvider.getExamQuestion(exam, getExamQuestion.question, user)
  }

  @Authorized()
  @Mutation(_returns => Exam)
  public async createExamCompletion(
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<Exam> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId, user)

    await this.examCompletionCreator.createExamCompletion(exam, user)

    return exam
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteExam(
    @Args() getExam: GetExam,
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.validator.validate(getExam)
    const exam = await this.examProvider.getExam(getExam.examId, user)

    await this.examDeleter.deleteExam(exam, user)

    return true
  }

  @FieldResolver(_returns => Category, { name: 'category' })
  public async getExamCategory(
    @Root() exam: Exam,
  ): Promise<Category> {
    return await this.categoryProvider.getCategory(exam.categoryId)
  }

  @Authorized()
  @Query(_returns => [ Exam ], { name: 'currentExams' })
  public async getCurrentExams(
    @Args() getCurrentExams: GetCurrentExams,
    @Ctx('user') user: User,
  ): Promise<Exam[]> {
    await this.validator.validate(getCurrentExams)
    const categories = await this.categoryListProvider.getCategoriesByIds(getCurrentExams.categoryIds)

    return await this.currentExamListProvider.getCurrentExams(categories, user)
  }
}