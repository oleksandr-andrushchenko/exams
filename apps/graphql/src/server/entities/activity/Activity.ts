import { Column, Entity } from 'typeorm'
import { Field, ObjectType } from 'type-graphql'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'bson'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'

@ObjectType()
@Entity({ name: 'activities' })
export default class Activity extends Base {
  @Column({ type: 'varchar' })
  @Field((_type) => String!)
  public event: string

  @Column({ type: 'varchar', length: 24, nullable: true, transformer: ObjectIdTransformer })
  @Field((_type) => ObjectIdScalar, { nullable: true })
  public examId?: ObjectId

  @Column({ nullable: true })
  @Field({ nullable: true })
  public examName?: string
}
