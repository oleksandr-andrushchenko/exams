import { Inject, Service } from 'typedi'
import config from '../../configuration'
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
import ExamTagManager from '../examTag/ExamTagManager'

@Service()
export default class ExamCreator {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examVerifier: ExamVerifier,
    @Inject() private readonly examTagManager: ExamTagManager,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  public async createExam(createExam: CreateExam, initiator: User): Promise<Exam> {
    await this.validator.validate(createExam)
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Create)
    await this.examVerifier.verifyExamNameNotExists(createExam.name)

    const exam = new Exam()
    exam.name = createExam.name
    exam.requiredScore = createExam.requiredScore
    exam.imageFilename = createExam.imageFilename
    exam.creatorId = initiator.id
    exam.ownerId = initiator.id
    exam.createdAt = new Date()
    await this.entityManager.save(exam)
    const persistedExam = await this.entityManager.getRepository(Exam).findOneByOrFail({ name: exam.name })
    const [row] = await this.entityManager.query('SELECT id FROM \"' + config.db.schema + '\".exams WHERE name = $1', [
      exam.name
    ])
    const examId = row.id
    const tags = await this.examTagManager.resolve(createExam.tags, this.entityManager)
    await this.examTagManager.attach(examId, tags, this.entityManager)
    await this.eventDispatcher.dispatch(ExamEvent.Created, { exam: persistedExam })
    return persistedExam
  }
}
