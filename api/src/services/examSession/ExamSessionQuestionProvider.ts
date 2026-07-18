import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ExamSession from '../../entities/examSession/ExamSession'
import ExamSessionQuestionSchema from '../../schema/examSession/ExamSessionQuestionSchema'
import QuestionProvider from '../question/QuestionProvider'
import ExamSessionQuestionNumberNotFoundError from '../../errors/examSession/ExamSessionQuestionNumberNotFoundError'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import QuestionType from '../../entities/question/QuestionType'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamSessionQuestionProvider {

  public constructor(
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {ExamSession} examSession
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<ExamSessionQuestionSchema>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ExamSessionQuestionNumberNotFoundError}
   */
  public async getExamSessionQuestion(examSession: ExamSession, questionNumber: number, initiator: User): Promise<ExamSessionQuestionSchema> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.GetQuestion, examSession)

    const questions = examSession.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamSessionQuestionNumberNotFoundError(questionNumber)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    const examSessionQuestion = new ExamSessionQuestionSchema()
    examSessionQuestion.examSession = examSession
    examSessionQuestion.question = question
    examSessionQuestion.number = questionNumber

    if (question.type === QuestionType.CHOICE) {
      examSessionQuestion.choice = questions[questionNumber].choice
      examSessionQuestion.choices = question.choices.map(choice => choice.title)
    }

    return examSessionQuestion
  }
}