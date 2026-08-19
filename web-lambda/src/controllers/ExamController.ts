import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import { namedError } from '../../../shared/src/errors'
import { queryObject } from '../../../shared/src/http'
import Exam from '../../../shared/src/entities/exam/Exam'
import ExamPermission from '../../../shared/src/enums/exam/ExamPermission'
import AuthorizationVerifier from '../../../shared/src/services/auth/AuthorizationVerifier'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import { route } from '../routes'

@Service()
export default class ExamController {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {
  }

  public async listExams(request: Request, response: Response): Promise<void> {
    const filters = this.filters(request)
    const user = await this.authUserProvider.getAuthUser(request)
    response.render('exams.html', {
      page: await this.examProvider.getExamList(filters, user),
      filters,
      title: 'Exams'
    })
  }

  public async editExam(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const exam = await this.examProvider.getExam(request.params.examId)
    await this.authorizationVerifier.verifyAuthorization(user, ExamPermission.Update, exam)
    response.render('edit.html', { resource: 'exam', exam })
  }

  public async createExamPage(request: Request, response: Response): Promise<void> {
    if (!(await this.authUserProvider.getAuthUser(request))) {
      response.redirect(route('login', {}, { redirect: route('newExam') }))
      return
    }
    response.render('create-exam.html', { title: 'Create exam' })
  }

  public async getExam(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getAuthUser(request)
    const exam = await this.examProvider.getExam(request.params.examId, user)
    response.render('exam.html', { exam, title: exam.name })
  }

  public async getPublicExam(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getAuthUser(request)
    const exam = (await this.examProvider.getExam(request.params.examSlug, user)) as Exam & { userSlug?: string }
    if (exam.slug !== request.params.examSlug || exam.userSlug !== request.params.userSlug) {
      throw namedError('ExamNotFoundError', 'Exam not found')
    }
    response.render('exam.html', { exam, title: exam.name })
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
