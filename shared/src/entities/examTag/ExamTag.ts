import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm'
import { ObjectId } from 'bson'
import Exam from '../exam/Exam'

@Entity({ name: 'examTags' })
export default class ExamTag {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  public readonly id: string = new ObjectId().toHexString()

  @Column({ unique: true, length: 50 })
  public name: string

  @Column({ unique: true, length: 60 })
  public slug: string

  @Column({ type: 'integer', default: 0 })
  public rating: number = 0

  @Column({ nullable: true })
  public imageFilename?: string

  @ManyToMany((_type) => Exam, (exam) => exam.tags)
  public exams: Exam[]
}
