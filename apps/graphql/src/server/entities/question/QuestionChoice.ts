import { Field, ObjectType } from 'type-graphql'
import { Column } from 'typeorm'

@ObjectType()
export default class QuestionChoice {

  @Column()
  @Field()
  public title: string

  @Column()
  @Field({ nullable: true })
  public correct?: boolean

  @Column()
  @Field({ nullable: true })
  public explanation?: string
}