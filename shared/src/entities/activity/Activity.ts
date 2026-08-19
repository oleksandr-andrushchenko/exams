import { Column, Entity } from 'typeorm'
import Base from '../Base'
import { ObjectId } from 'bson'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'

@Entity({ name: 'activities' })
export default class Activity extends Base {
  @Column({ type: 'varchar' })
  public event: string

  @Column({ type: 'varchar', length: 24, nullable: true, transformer: ObjectIdTransformer })
  public examId?: ObjectId

  @Column({ nullable: true })
  public examName?: string
}
