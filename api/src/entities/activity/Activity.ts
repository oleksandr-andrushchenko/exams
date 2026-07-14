import { Column, Entity } from 'typeorm'
import { Field, ObjectType } from 'type-graphql'
import Base from '../Base'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import { ObjectId } from 'mongodb'
import { Event } from '../../enums/Event'

@ObjectType()
@Entity({ name: 'activities' })
export default class Activity extends Base {

  @Column({ type: 'enum', enum: Event })
  @Field(_type => String!)
  public event: Event

  @Column()
  @Field(_type => ObjectIdScalar, { nullable: true })
  public categoryId?: ObjectId

  @Column()
  @Field({ nullable: true })
  public categoryName?: string
}