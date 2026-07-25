import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm'
import { Inject, Service } from 'typedi'
import EscapeHtmlSpecialCharsService from '../services/html/EscapeHtmlSpecialCharsService'
import Question from '../entities/question/Question'

@Service()
@EventSubscriber()
export default class QuestionSubscriber implements EntitySubscriberInterface {

  public constructor(
    @Inject() private readonly escapeHtmlSpecialCharsService: EscapeHtmlSpecialCharsService,
  ) {
  }

  public listenTo(): typeof Question {
    return Question
  }

  public async beforeInsert(event: InsertEvent<Question>): Promise<void> {
    this.escapeTitle(event.entity)
  }

  public async beforeUpdate(event: UpdateEvent<Question>): Promise<void> {
    this.escapeTitle(event.entity as Question, true)
  }

  private escapeTitle(question: Question, update: boolean = false): void {
    let title = question.title

    if (update) {
      title = this.escapeHtmlSpecialCharsService.unescapeHtmlSpecialChars(title)
    }

    title = this.escapeHtmlSpecialCharsService.escapeHtmlSpecialChars(title)

    question.title = title
  }
}