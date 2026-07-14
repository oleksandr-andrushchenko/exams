import { Inject, Service } from 'typedi'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import ExamEvent from '../../enums/exam/ExamEvent'
import Exam from '../../entities/exam/Exam'
import UserCategoryExamsSyncer from '../../services/user/UserCategoryExamsSyncer'
import User from '../../entities/user/User'

@Service()
@EventSubscriber(ExamEvent.Deleted)
export default class ExamDeletedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly userCategoryExamsSyncer: UserCategoryExamsSyncer,
  ) {
  }

  public async handle({ exam, user }: { exam: Exam, user: User }): Promise<void> {
    await this.userCategoryExamsSyncer.syncUserCategoryExams(user)
  }
}