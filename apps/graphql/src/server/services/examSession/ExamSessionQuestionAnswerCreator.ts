import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamSession from '../../entities/examSession/ExamSession'
import CreateExamSessionQuestionAnswer from '../../schema/examSession/CreateExamSessionQuestionAnswer'
import QuestionProvider from '../question/QuestionProvider'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import QuestionType from '../../entities/question/QuestionType'
import ExamSessionQuestion from '../../entities/examSession/ExamSessionQuestion'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamSessionQuestionAnswerCreator {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  /**
   * @param {ExamSession} examSession
   * @param {number} questionNumber
   * @param {CreateExamSessionQuestionAnswer} createExamSessionQuestionAnswer
   * @param {User} initiator
   * @returns {Promise<ExamSessionQuestion>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async createExamSessionQuestionAnswer(
    examSession: ExamSession,
    questionNumber: number,
    createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer,
    initiator: User
  ): Promise<ExamSessionQuestion> {
    await this.authorizationVerifier.verifyAuthorization(
      initiator,
      ExamSessionPermission.CreateQuestionAnswer,
      examSession
    )
    await this.validator.validate(createExamSessionQuestionAnswer)

    const questions = examSession.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    if (question.type === QuestionType.CHOICE) {
      questions[questionNumber].choice = createExamSessionQuestionAnswer.choice
    }

    // todo: optimize
    examSession.questions = questions
    examSession.updatedAt = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<ExamSession>(examSession)

    return questions[questionNumber]
  }
}
