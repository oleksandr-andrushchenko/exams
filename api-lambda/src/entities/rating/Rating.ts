import { Column } from 'typeorm'

export default class Rating {
  @Column()
  public markCount: number

  @Column()
  public averageMark: number
}
