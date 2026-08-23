import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import Question from '../../../shared/src/entities/question/Question'
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

  public async indexQuestions(request: Request, response: Response): Promise<void> {
    response.render('questions.html', {
      curUser: await this.authUserProvider.getAuthUser(request),
      questions: await this.questionProvider.getLastQuestions(),
      title: 'Questions'
    })
  }

  public async editQuestion(request: Request, response: Response): Promise<void> {
    const user = await this.authUserProvider.getRequiredAuthUser(request)
    const question = await this.questionProvider.getQuestion(request.params.questionId)
    await this.authorizationVerifier.verifyAuthorization(user, QuestionPermission.Update, question)
    response.render('edit-question.html', {
      question
    })
  }

  public async newQuestion(request: Request, response: Response): Promise<void> {
    const curUser = await this.authUserProvider.getRequiredAuthUser(request)
    const exam = await this.examProvider.getExam(request.params.examId)
    await this.authorizationVerifier.verifyAuthorization(curUser, ExamPermission.AddQuestion, exam)
    response.render('new-question.html', {
      exam,
      title: 'Add question'
    })
  }

  public async _showQuestion(question: Question, request: Request, response: Response): Promise<void> {
    response.render('question.html', {
      curUser: await this.authUserProvider.getAuthUser(request),
      question,
      title: question.title
    })
  }

  public async showQuestion(request: Request, response: Response): Promise<void> {
    const question = await this.questionProvider.getQuestion(request.params.questionId)
    await this._showQuestion(question, request, response)
  }

  public async showQuestionBySlugs(request: Request, response: Response): Promise<void> {
    const { userSlug, examSlug, questionSlug } = request.params
    const question = await this.questionProvider.getQuestionBySlugs(userSlug, examSlug, questionSlug)
    await this._showQuestion(question, request, response)
  }
}
