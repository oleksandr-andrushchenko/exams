import { Inject, Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import ExamEvent from '../../enums/exam/ExamEvent'
import ExamActivityCreator from '../../services/exam/ExamActivityCreator'
import User from '../../entities/user/User'
import UserExamRatingMarksSyncer from '../../services/user/UserExamRatingMarksSyncer'
import ExamRatingSyncer from '../../services/exam/ExamRatingSyncer'
import UserRatingSyncer from '../../services/user/UserRatingSyncer'

@Service()
@EventSubscriber(ExamEvent.Rated)
export default class ExamRatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly examActivityCreator: ExamActivityCreator,
    @Inject() private readonly userExamRatingMarksSyncer: UserExamRatingMarksSyncer,
    @Inject() private readonly examRatingSyncer: ExamRatingSyncer,
    @Inject() private readonly userRatingSyncer: UserRatingSyncer,
  ) {
  }

  public async handle({ exam, user }: { exam: Exam, user: User }): Promise<void> {
    await this.examActivityCreator.createExamActivity(exam, ExamEvent.Rated)
    await this.userExamRatingMarksSyncer.syncUserExamRatingMarks(user)
    await this.examRatingSyncer.syncExamRating(exam)
    await this.userRatingSyncer.syncUserRatingByExam(exam)
  }
}