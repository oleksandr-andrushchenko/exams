import { Column } from 'typeorm'
import { ObjectId } from 'bson'

export default class ExamSessionQuestion {
  @Column()
  public questionId: ObjectId

  @Column()
  public choice?: number

  @Column()
  public answer?: string
}
