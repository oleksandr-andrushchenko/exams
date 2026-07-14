import { Field, Int, ObjectType } from 'type-graphql'
import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'

@ObjectType()
@Entity({ name: 'questionRatingMarks' })
export default class QuestionRatingMark extends Base {

  @Column()
  @Field(_type => ObjectIdScalar)
  public questionId: ObjectId

  @Column()
  @Field(_type => Int)
  public mark: number
}