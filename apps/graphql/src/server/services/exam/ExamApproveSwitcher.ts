import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Exam from '../../entities/exam/Exam'
import ExamPermission from '../../enums/exam/ExamPermission'
import ExamRepository from '../../repositories/exam/ExamRepository'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamApproveSwitcher {
  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {}

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async toggleExamApprove(exam: Exam, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Approve)

    await this.examRepository.updateOneByEntity(exam, {
      ownerId: this.isExamApproved(exam) ? exam.creatorId : undefined,
      updatedAt: new Date()
    })

    await this.eventDispatcher.dispatch(ExamEvent.ApproveToggled, { exam, initiator })

    if (this.isExamApproved(exam)) {
      await this.eventDispatcher.dispatch(ExamEvent.Approved, { exam, initiator })
    }

    return exam
  }

  public isExamApproved(exam: Exam): boolean {
    return !exam.ownerId
  }
}
