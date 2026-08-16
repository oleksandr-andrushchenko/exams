import { Column, Entity } from 'typeorm'
import { ObjectId } from 'bson'
import Base from '../Base'
import ExamSessionQuestion from './ExamSessionQuestion'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'
import ObjectIdJsonTransformer from '../../database/ObjectIdJsonTransformer'

@Entity({ name: 'examSessions' })
export default class ExamSession extends Base {
  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  public examId: ObjectId

  @Column({ type: 'jsonb', transformer: ObjectIdJsonTransformer })
  public questions: ExamSessionQuestion[]

  @Column({ type: 'integer', nullable: true })
  public questionNumber?: number = 0

  @Column({ type: 'integer', nullable: true })
  public correctAnswerCount?: number = 0

  @Column({ type: 'timestamptz', nullable: true })
  public completedAt?: Date

  public questionCount(): number {
    return this.questions?.length || 0
  }

  public answeredQuestionCount(): number {
    return (this?.questions || []).filter(
      (question: ExamSessionQuestion): boolean =>
        typeof question.choice === 'number' || typeof question.answer === 'string'
    ).length
  }
}
