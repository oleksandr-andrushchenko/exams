import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import CategoryProvider from '../category/CategoryProvider'
import Exam from '../../entities/exam/Exam'
import Question from '../../entities/question/Question'
import ExamPermission from '../../enums/exam/ExamPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import CategoryQuestionListProvider from '../question/CategoryQuestionListProvider'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamCompletionCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly categoryQuestionListProvider: CategoryQuestionListProvider,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   */
  public async createExamCompletion(exam: Exam, initiator: User): Promise<void> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.CreateCompletion, exam)

    const category = await this.categoryProvider.getCategory(exam.categoryId)
    const questions = await this.categoryQuestionListProvider.getCategoryQuestions(category) as Question[]

    const questionsHashedById = []

    for (const question of questions) {
      questionsHashedById[question.id.toString()] = question
    }

    let correctAnswerCount = 0

    for (const examQuestion of exam.questions) {
      const question = questionsHashedById[examQuestion.questionId.toString()]

      if (typeof examQuestion.choice !== 'undefined') {
        if ((question.choices || [])[examQuestion.choice]?.correct) {
          correctAnswerCount++
        }
      }
    }

    exam.correctAnswerCount = correctAnswerCount
    exam.completedAt = new Date()
    exam.updatedAt = new Date()

    await this.entityManager.save<Exam>(exam)
    this.eventDispatcher.dispatch(ExamEvent.Completed, { exam, user: initiator })
  }
}