import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectId } from 'bson'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'

@Entity({ name: 'examRatingMarks' })
export default class ExamRatingMark extends Base {
  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  public examId: ObjectId

  @Column()
  public mark: number
}
