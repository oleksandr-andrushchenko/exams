import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import { queryObject } from '../../../shared/src/http'
import { namedError } from '../../../shared/src/errors'
import Question from '../../../shared/src/entities/question/Question'
import Exam from '../../../shared/src/entities/exam/Exam'
import ExamPermission from '../../../shared/src/enums/exam/ExamPermission'
import QuestionPermission from '../../../shared/src/enums/question/QuestionPermission'
import AuthorizationVerifier from '../../../shared/src/services/auth/AuthorizationVerifier'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import QuestionProvider from '../../../shared/src/services/question/QuestionProvider'

@Service()
export default class QuestionController {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {
  }

  public async listQuestions(request: Request, response: Response): Promise<void> {
    const filters = this.filters(request)
    const user = await this.authUserProvider.getAuthUser(request)
    response.render('questions.html', {
      page: await this.questionProvider.getQuestionList(filters, user),
      filters,
      title: 'Questions'
    })
  }

  public async editQuestion(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const question = await this.questionProvider.getQuestion(request.params.questionId)
    await this.authorizationVerifier.verifyAuthorization(user, QuestionPermission.Update, question)
    response.render('edit.html', { resource: 'question', question })
  }

  public async createQuestionPage(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const exam = await this.examProvider.getExam(String(request.query.exam || ''))
    await this.authorizationVerifier.verifyAuthorization(user, ExamPermission.AddQuestion, exam)
    response.render('create-question.html', { exam, title: 'Add question' })
  }

  public async getQuestion(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getAuthUser(request)
    const question = await this.questionProvider.getQuestion(request.params.questionId, user)
    response.render('question.html', { question, title: question.title })
  }

  public async getPublicQuestion(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getAuthUser(request)
    const question = (await this.questionProvider.getQuestion(request.params.questionSlug, user)) as Question & {
      exam?: Exam & { userSlug?: string }
    }
    if (question.exam?.slug !== request.params.examSlug || question.exam.userSlug !== request.params.userSlug) {
      throw namedError('QuestionNotFoundError', 'Question not found')
    }
    response.render('question.html', { question, title: question.title })
  }

  private filters(request: Request): Record<string, unknown> {
    const query = queryObject(request.query)
    const number = (value: unknown, fallback: number) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
    }
    return {
      search: typeof query.search === 'string' ? query.search : undefined,
      approved: typeof query.approved === 'string' ? query.approved : undefined,
      difficulty: typeof query.difficulty === 'string' ? query.difficulty : undefined,
      type: typeof query.type === 'string' ? query.type : undefined,
      tag: typeof query.tag === 'string' ? query.tag : undefined,
      exam: typeof query.exam === 'string' ? query.exam : undefined,
      page: number(query.page, 1),
      size: Math.min(50, number(query.size, 20)),
      sort: typeof query.sort === 'string' ? query.sort : undefined,
      order: query.order === 'asc' ? 'asc' : 'desc'
    }
  }
}
