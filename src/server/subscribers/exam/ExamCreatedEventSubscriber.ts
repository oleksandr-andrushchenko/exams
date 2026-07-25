import { Inject, Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import ExamEvent from '../../enums/exam/ExamEvent'
import ExamActivityCreator from '../../services/exam/ExamActivityCreator'

@Service()
@EventSubscriber(ExamEvent.Created)
export default class ExamCreatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly examActivityCreator: ExamActivityCreator,
  ) {
  }

  public async handle({ exam }: { exam: Exam }): Promise<void> {
    await this.examActivityCreator.createExamActivity(exam, ExamEvent.Created)
  }
}