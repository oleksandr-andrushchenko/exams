import { Inject, Service } from 'typedi'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import User from '../../entities/user/User'
import QuestionEvent from '../../enums/question/QuestionEvent'
import Question from '../../entities/question/Question'
import QuestionRatingSyncer from '../../services/question/QuestionRatingSyncer'
import UserQuestionRatingMarksSyncer from '../../services/user/UserQuestionRatingMarksSyncer'
import ExamProvider from '../../services/exam/ExamProvider'
import ExamRatingSyncer from '../../services/exam/ExamRatingSyncer'
import UserRatingSyncer from '../../services/user/UserRatingSyncer'

@Service()
@EventSubscriber(QuestionEvent.Rated)
export default class QuestionRatedEventSubscriber implements EventSubscriberInterface {
  public constructor(
    @Inject() private readonly questionRatedEventSubscriber: UserQuestionRatingMarksSyncer,
    @Inject() private readonly questionRatingSyncer: QuestionRatingSyncer,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly examRatingSyncer: ExamRatingSyncer,
    @Inject() private readonly userRatingSyncer: UserRatingSyncer
  ) {}

  public async handle({ question, user }: { question: Question; user: User }): Promise<void> {
    await this.questionRatedEventSubscriber.syncUserQuestionRatingMarks(user)
    await this.questionRatingSyncer.syncQuestionRating(question)
    const exam = await this.examProvider.getExam(question.examId)
    await this.examRatingSyncer.syncExamRating(exam)
    await this.userRatingSyncer.syncUserRatingByExam(exam)
  }
}
