import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ExamSession from '../../entities/examSession/ExamSession'
import QuestionProvider from '../question/QuestionProvider'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import QuestionType from '../../entities/question/QuestionType'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamSessionQuestionAnswerDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {ExamSession} examSession
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async deleteExamSessionQuestionAnswer(
    examSession: ExamSession,
    questionNumber: number,
    initiator: User,
  ): Promise<void> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.DeleteQuestionAnswer, examSession)

    const questions = examSession.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    if (question.type === QuestionType.CHOICE) {
      delete questions[questionNumber].choice
    }

    // todo: optimize
    examSession.questions = questions
    examSession.updatedAt = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<ExamSession>(examSession)
  }
}