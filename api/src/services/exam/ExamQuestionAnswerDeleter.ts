import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import Exam from '../../entities/exam/Exam'
import QuestionProvider from '../question/QuestionProvider'
import ExamPermission from '../../enums/exam/ExamPermission'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import QuestionType from '../../entities/question/QuestionType'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamQuestionAnswerDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async deleteExamQuestionAnswer(
    exam: Exam,
    questionNumber: number,
    initiator: User,
  ): Promise<void> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.DeleteQuestionAnswer, exam)

    const questions = exam.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    if (question.type === QuestionType.CHOICE) {
      delete questions[questionNumber].choice
    }

    // todo: optimize
    exam.questions = questions
    exam.updatedAt = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<Exam>(exam)
  }
}