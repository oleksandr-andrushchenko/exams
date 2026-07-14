import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Exam from '../../entities/exam/Exam'
import CreateExamQuestionAnswer from '../../schema/exam/CreateExamQuestionAnswer'
import QuestionProvider from '../question/QuestionProvider'
import ExamPermission from '../../enums/exam/ExamPermission'
import QuestionNotFoundError from '../../errors/question/QuestionNotFoundError'
import QuestionType from '../../entities/question/QuestionType'
import ExamQuestion from '../../entities/exam/ExamQuestion'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamQuestionAnswerCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly questionProvider: QuestionProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {CreateExamQuestionAnswer} createExamQuestionAnswer
   * @param {User} initiator
   * @returns {Promise<ExamQuestion>}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionNotFoundError}
   * @throws {ValidatorError}
   */
  public async createExamQuestionAnswer(
    exam: Exam,
    questionNumber: number,
    createExamQuestionAnswer: CreateExamQuestionAnswer,
    initiator: User,
  ): Promise<ExamQuestion> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.CreateQuestionAnswer, exam)
    await this.validator.validate(createExamQuestionAnswer)

    const questions = exam.questions
    const questionId = questions[questionNumber]

    if (questionId === undefined) {
      throw new QuestionNotFoundError('undefined' as any)
    }

    const question = await this.questionProvider.getQuestion(questions[questionNumber].questionId)

    if (question.type === QuestionType.CHOICE) {
      questions[questionNumber].choice = createExamQuestionAnswer.choice
    }

    // todo: optimize
    exam.questions = questions
    exam.updatedAt = new Date()

    // todo: optimize, run partial array query
    await this.entityManager.save<Exam>(exam)

    return questions[questionNumber]
  }
}