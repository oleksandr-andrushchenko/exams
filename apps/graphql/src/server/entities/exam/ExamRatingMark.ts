import { Field, Int, ObjectType } from 'type-graphql'
import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'bson'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'

@ObjectType()
@Entity({ name: 'examRatingMarks' })
export default class ExamRatingMark extends Base {
  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  @Field((_type) => ObjectIdScalar)
  public examId: ObjectId

  @Column()
  @Field((_type) => Int)
  public mark: number
}
