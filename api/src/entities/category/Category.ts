import { Column, Entity } from 'typeorm'
import { Field, Int, ObjectType } from 'type-graphql'
import Base from '../Base'
import Rating from '../rating/Rating'

@ObjectType()
@Entity({ name: 'categories' })
export default class Category extends Base {

  @Column({ unique: true })
  @Field()
  public name: string

  @Column()
  @Field(_type => Int, { nullable: true })
  public questionCount?: number = 0

  @Column()
  @Field(_type => Int, { nullable: true })
  public approvedQuestionCount?: number = 0

  @Column()
  @Field(_type => Int, { nullable: true })
  public requiredScore?: number = 0

  @Column(() => Rating)
  public rating?: Rating

  @Field(_type => Boolean, { name: 'isApproved', nullable: true })
  public getIsApproved(): boolean {
    return !this.ownerId
  }
}