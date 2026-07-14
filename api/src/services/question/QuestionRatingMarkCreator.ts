import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Question from '../../entities/question/Question'
import QuestionPermission from '../../enums/question/QuestionPermission'
import QuestionRatedAlready from '../../errors/question/QuestionRatedAlready'
import QuestionEvent from '../../enums/question/QuestionEvent'
import QuestionRatingMarkRepository from '../../repositories/question/QuestionRatingMarkRepository'
import QuestionRatingMark from '../../entities/question/QuestionRatingMark'

@Service()
export default class QuestionRatingMarkCreator {

  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly questionRatingMarkRepository: QuestionRatingMarkRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
  ) {
  }

  /**
   * @param {Question} question
   * @param {number} mark
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async createQuestionRatingMark(question: Question, mark: number, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Rate, question)

    const existingRatingMark = await this.questionRatingMarkRepository.findOneByQuestionAndCreator(question, initiator)

    if (existingRatingMark) {
      throw new QuestionRatedAlready(question)
    }

    const ratingMark = new QuestionRatingMark()
    ratingMark.questionId = question.id
    ratingMark.mark = mark
    ratingMark.creatorId = initiator.id
    ratingMark.createdAt = new Date()

    await this.entityManager.save<QuestionRatingMark>(ratingMark)
    this.eventDispatcher.dispatch(QuestionEvent.Rated, { question, user: initiator })

    return question
  }
}