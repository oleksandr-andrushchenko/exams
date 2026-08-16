import { IsBoolean, Length, ValidateIf } from 'class-validator'
import { Column } from 'typeorm'

export class QuestionChoiceSchema {
  @Length(10, 3000)
  @Column()
  public readonly title: string

  @ValidateIf((target) => 'correct' in target)
  @IsBoolean()
  @Column()
  public readonly correct?: boolean

  @ValidateIf((target) => 'explanation' in target)
  @Length(10, 3000)
  @Column()
  public readonly explanation?: string
}
