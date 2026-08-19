import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Question from '../../entities/question/Question'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionRepository from '../../repositories/questions/QuestionRepository'
import ExamProvider from '../exam/ExamProvider'
import ExamRepository from '../../repositories/exams/ExamRepository'
import EventDispatcher from '../event/EventDispatcher'
import QuestionEvent from '../../enums/question/QuestionEvent'

@Service()
export default class QuestionApproveSwitcher {
  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {}

  /**
   * @param {Question} question
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async toggleQuestionApprove(question: Question, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Approve)

    const exam = await this.examProvider.getExam(question.examId)
    const approvedQuestionCount = await this.questionRepository.countByExamWithoutOwner(exam)

    if (this.isQuestionApproved(question)) {
      await this.questionRepository.updateOneByEntity(question, { ownerId: question.creatorId, updatedAt: new Date() })

      const newApprovedQuestionCount = Math.max(0, approvedQuestionCount - 1)
      await this.examRepository.updateOneByEntity(exam, {
        approvedQuestionCount: newApprovedQuestionCount === 0 ? undefined : newApprovedQuestionCount,
        updatedAt: new Date()
      })
    } else {
      await this.questionRepository.updateOneByEntity(question, { ownerId: undefined, updatedAt: new Date() })

      await this.examRepository.updateOneByEntity(exam, {
        approvedQuestionCount: approvedQuestionCount + 1,
        updatedAt: new Date()
      })
    }

    await this.eventDispatcher.dispatch(QuestionEvent.ApproveToggled, { question, initiator })

    return question
  }

  public isQuestionApproved(question: Question): boolean {
    return !question.ownerId
  }
}
