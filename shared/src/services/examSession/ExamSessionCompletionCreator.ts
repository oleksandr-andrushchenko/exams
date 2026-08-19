import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ExamProvider from '../exam/ExamProvider'
import ExamSession from '../../entities/examSession/ExamSession'
import Question from '../../entities/question/Question'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import ExamQuestionListProvider from '../question/ExamQuestionListProvider'
import EventDispatcher from '../event/EventDispatcher'
import ExamSessionEvent from '../../enums/examSession/ExamSessionEvent'

@Service()
export default class ExamSessionCompletionCreator {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly examQuestionListProvider: ExamQuestionListProvider,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {}

  /**
   * @param {ExamSession} examSession
   * @param {User} initiator
   * @returns {Promise<void>}
   * @throws {AuthorizationFailedError}
   */
  public async createExamSessionCompletion(examSession: ExamSession, initiator: User): Promise<void> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.CreateCompletion, examSession)

    const exam = await this.examProvider.getExam(examSession.examId)
    const questions = (await this.examQuestionListProvider.getExamQuestions(exam)) as Question[]

    const questionsHashedById = []

    for (const question of questions) {
      questionsHashedById[question.id.toString()] = question
    }

    let correctAnswerCount = 0

    for (const examSessionQuestion of examSession.questions) {
      const question = questionsHashedById[examSessionQuestion.questionId.toString()]

      if (typeof examSessionQuestion.choice !== 'undefined') {
        if ((question.choices || [])[examSessionQuestion.choice]?.correct) {
          correctAnswerCount++
        }
      }
    }

    examSession.correctAnswerCount = correctAnswerCount
    examSession.completedAt = new Date()
    examSession.updatedAt = new Date()

    await this.entityManager.save<ExamSession>(examSession)
    await this.eventDispatcher.dispatch(ExamSessionEvent.Completed, { examSession, user: initiator })
  }
}
