import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'
import CreateExam from '../../schema/exam/CreateExam'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamPermission from '../../enums/exam/ExamPermission'
import ExamVerifier from './ExamVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examVerifier: ExamVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateExam} createExam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   * @throws {ExamNameTakenError}
   */
  public async createExam(createExam: CreateExam, initiator: User): Promise<Exam> {
    await this.validator.validate(createExam)

    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Create)

    const name = createExam.name
    await this.examVerifier.verifyExamNameNotExists(name)

    const exam: Exam = new Exam()
    exam.name = name
    exam.requiredScore = createExam.requiredScore
    exam.creatorId = initiator.id
    exam.ownerId = initiator.id
    exam.createdAt = new Date()

    await this.entityManager.save<Exam>(exam)
    await this.eventDispatcher.dispatch(ExamEvent.Created, { exam })

    return exam
  }
}