import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectId } from 'bson'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'

@Entity({ name: 'questionRatingMarks' })
export default class QuestionRatingMark extends Base {
  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  public questionId: ObjectId

  @Column()
  public mark: number
}
