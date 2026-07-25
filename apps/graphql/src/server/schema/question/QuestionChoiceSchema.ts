import { Field, InputType } from 'type-graphql'
import { IsBoolean, Length, ValidateIf } from 'class-validator'
import { Column } from 'typeorm'

@InputType()
export class QuestionChoiceSchema {

  @Length(10, 3000)
  @Column()
  @Field()
  public readonly title: string

  @ValidateIf(target => 'correct' in target)
  @IsBoolean()
  @Column()
  @Field({ nullable: true })
  public readonly correct?: boolean

  @ValidateIf(target => 'explanation' in target)
  @Length(10, 3000)
  @Column()
  @Field({ nullable: true })
  public readonly explanation?: string
}