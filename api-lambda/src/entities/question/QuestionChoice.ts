import { Column } from 'typeorm'

export default class QuestionChoice {
  @Column()
  public title: string

  @Column()
  public correct?: boolean

  @Column()
  public explanation?: string
}
