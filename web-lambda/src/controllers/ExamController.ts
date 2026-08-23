import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import Exam from '../../../shared/src/entities/exam/Exam'
import AuthorizationVerifier from '../../../shared/src/services/auth/AuthorizationVerifier'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import ExamProvider from '../../../shared/src/services/exam/ExamProvider'
import ExamQuestionListProvider from '../../../shared/src/services/question/ExamQuestionListProvider'
import Question from '../../../shared/src/entities/question/Question'
import { route } from '../../../shared/src/routes'
import Permission from "../../../shared/src/enums/Permission";

@Service()
export default class ExamController {
  public constructor(
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly examQuestionListProvider: ExamQuestionListProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {
  }

  public async indexExams(request: Request, response: Response): Promise<void> {
    response.render('exams.html', {
      curUser: await this.authUserProvider.getAuthUser(request),
      exams: await this.examProvider.getLastExams(),
      title: 'Exams'
    })
  }

  public async editExam(request: Request, response: Response): Promise<void> {
    const curUser = await this.authUserProvider.getRequiredAuthUser(request)
    const exam = await this.examProvider.getExam(request.params.examId)
    await this.authorizationVerifier.verifyAuthorization(curUser, Permission.UpdateExam, exam)
    response.render('edit-exam.html', {
      curUser,
      exam,
      title: `Edit ${ exam.name } Exam`,
    })
  }

  public async newExam(request: Request, response: Response): Promise<void> {
    if (!(await this.authUserProvider.getAuthUser(request))) {
      response.redirect(route('login', {}, { redirect: route('newExam') }))
      return
    }
    response.render('new-exam.html', {
      title: 'New exam'
    })
  }

  private async _showExam(exam: Exam, request: Request, response: Response): Promise<void> {
    const curUser = await this.authUserProvider.getAuthUser(request)
    const questions = (await this.examQuestionListProvider.getExamQuestions(exam, undefined, false, curUser)) as Question[]
    response.render('exam.html', {
      curUser,
      exam,
      questions,
      title: exam.name
    })
  }

  public async showExam(request: Request, response: Response): Promise<void> {
    const exam = await this.examProvider.getExam(request.params.examId)
    await this._showExam(exam, request, response)
  }

  public async showExamBySlugs(request: Request, response: Response): Promise<void> {
    const exam = await this.examProvider.getExamBySlugs(request.params.userSlug, request.params.examSlug)
    await this._showExam(exam, request, response)
  }
}
