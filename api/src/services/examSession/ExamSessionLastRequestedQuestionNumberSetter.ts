import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ExamSession from '../../entities/examSession/ExamSession'
import ExamSessionQuestionNumberNotFoundError from '../../errors/examSession/ExamSessionQuestionNumberNotFoundError'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamSessionLastRequestedQuestionNumberSetter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {ExamSession} examSession
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<ExamSession>}
   * @throws {AuthorizationFailedError}
   * @throws {ExamSessionQuestionNumberNotFoundError}
   */
  public async setExamSessionLastRequestedQuestionNumber(examSession: ExamSession, questionNumber: number, initiator: User): Promise<ExamSession> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.GetQuestion, examSession)

    const questions = examSession.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamSessionQuestionNumberNotFoundError(questionNumber)
    }

    if (examSession.ownerId.toString() !== initiator.id.toString()) {
      return examSession
    }

    examSession.questionNumber = questionNumber
    examSession.updatedAt = new Date()

    await this.entityManager.save<ExamSession>(examSession)

    return examSession
  }
}