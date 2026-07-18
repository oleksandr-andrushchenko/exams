import { Field, Int, ObjectType } from 'type-graphql'
import { Column } from 'typeorm'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'bson'

@ObjectType()
export default class ExamSessionQuestion {

  @Column()
  @Field(_type => ObjectIdScalar)
  public questionId: ObjectId

  @Column()
  @Field(_type => Int, { nullable: true })
  public choice?: number

  @Column()
  @Field({ nullable: true })
  public answer?: string
}