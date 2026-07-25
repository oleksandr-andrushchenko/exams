import { Field, Float, Int, ObjectType } from 'type-graphql'
import { Column } from 'typeorm'

@ObjectType()
export default class Rating {

  @Column()
  @Field(_type => Int)
  public markCount: number

  @Column()
  @Field(_type => Float)
  public averageMark: number
}