import { Inject, Service } from 'typedi'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import ExamSessionEvent from '../../enums/examSession/ExamSessionEvent'
import ExamSession from '../../entities/examSession/ExamSession'
import UserExamExamSessionsSyncer from '../../services/user/UserExamExamSessionsSyncer'
import User from '../../entities/user/User'

@Service()
@EventSubscriber(ExamSessionEvent.Deleted)
export default class ExamSessionDeletedEventSubscriber implements EventSubscriberInterface {
  public constructor(@Inject() private readonly userExamExamSessionsSyncer: UserExamExamSessionsSyncer) {}

  public async handle({ examSession, user }: { examSession: ExamSession; user: User }): Promise<void> {
    await this.userExamExamSessionsSyncer.syncUserExamExamSessions(user)
  }
}
