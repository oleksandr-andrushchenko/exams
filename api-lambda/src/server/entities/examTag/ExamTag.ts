import { Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm'
import { Field, ID, Int, ObjectType } from 'type-graphql'
import { ObjectId } from 'bson'
import Exam from '../exam/Exam'

@ObjectType()
@Entity({ name: 'examTags' })
export default class ExamTag {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  @Field((_type) => ID)
  public readonly id: string = new ObjectId().toHexString()

  @Column({ unique: true, length: 50 })
  @Field()
  public name: string

  @Column({ unique: true, length: 60 })
  @Field()
  public slug: string

  @Column({ type: 'integer', default: 0 })
  @Field((_type) => Int)
  public rating: number = 0

  @Column({ nullable: true })
  @Field({ nullable: true })
  public imageFilename?: string

  @ManyToMany((_type) => Exam, (exam) => exam.tags)
  public exams: Exam[]
}
