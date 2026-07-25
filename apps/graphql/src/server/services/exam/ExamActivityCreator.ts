import { Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Exam from '../../entities/exam/Exam'
import Activity from '../../entities/activity/Activity'
import { Event } from '../../enums/Event'

@Service()
export default class ExamActivityCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
  ) {
  }

  public async createExamActivity(exam: Exam, event: Event): Promise<Activity> {
    const activity = new Activity()
    activity.event = event
    activity.examId = exam.id
    activity.examName = exam.name
    activity.createdAt = new Date()

    await this.entityManager.save<Activity>(activity)

    return activity
  }
}