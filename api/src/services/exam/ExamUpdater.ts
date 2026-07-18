import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'
import UpdateExam from '../../schema/exam/UpdateExam'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamPermission from '../../enums/exam/ExamPermission'
import ExamVerifier from './ExamVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamUpdater {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examVerifier: ExamVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {UpdateExam} updateExam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {ExamNameTakenError}
   */
  public async updateExam(exam: Exam, updateExam: UpdateExam, initiator: User): Promise<Exam> {
    await this.validator.validate(updateExam)

    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Update, exam)

    if ('name' in updateExam) {
      const name = updateExam.name
      await this.examVerifier.verifyExamNameNotExists(name, exam.id)

      exam.name = name
    }

    if ('requiredScore' in updateExam) {
      exam.requiredScore = updateExam.requiredScore
    }

    exam.updatedAt = new Date()

    await this.entityManager.save<Exam>(exam)
    await this.eventDispatcher.dispatch(ExamEvent.Updated, { exam })

    return exam
  }
}