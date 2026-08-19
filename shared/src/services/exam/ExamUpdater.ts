import { Inject, Service } from 'typedi'
import config from '../../config'
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
import ExamTagManager from '../examTag/ExamTagManager'

@Service()
export default class ExamUpdater {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examVerifier: ExamVerifier,
    @Inject() private readonly examTagManager: ExamTagManager,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  public async updateExam(exam: Exam, updateExam: UpdateExam, initiator: User): Promise<Exam> {
    await this.validator.validate(updateExam)
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Update, exam)

    if ('name' in updateExam) {
      await this.examVerifier.verifyExamNameNotExists(updateExam.name, exam.id)
      exam.name = updateExam.name
    }
    if ('requiredScore' in updateExam) exam.requiredScore = updateExam.requiredScore
    if ('imageFilename' in updateExam) exam.imageFilename = updateExam.imageFilename

    exam.updatedAt = new Date()
    await this.entityManager.save(exam)
    const persistedExam = await this.entityManager.getRepository(Exam).findOneByOrFail({ name: exam.name })
    const [row] = await this.entityManager.query('SELECT id FROM \"' + config.db.schema + '\".exams WHERE name = $1', [
      exam.name
    ])
    const examId = row.id
    if ('tags' in updateExam) {
      const tags = await this.examTagManager.resolve(updateExam.tags, this.entityManager)
      await this.examTagManager.attach(examId, tags, this.entityManager)
    }

    await this.eventDispatcher.dispatch(ExamEvent.Updated, { exam: persistedExam })
    return persistedExam
  }
}
