import { BeforeInsert, BeforeUpdate, Column, Entity, JoinTable, ManyToMany } from 'typeorm'
import { Field, Int, ObjectType } from 'type-graphql'
import Base from '../Base'
import Rating from '../rating/Rating'
import ExamTag from '../examTag/ExamTag'
import slugify from '../../services/normalizers/SlugNormalizer'

@ObjectType()
@Entity({ name: 'exams' })
export default class Exam extends Base {

  @BeforeInsert()
  @BeforeUpdate()
  private updateSlug(): void {
    this.slug = slugify(this.name, this.id.toString())
  }

  @Column({ unique: true, nullable: true })
  @Field()
  public slug: string

  @Column({ unique: true })
  @Field()
  public name: string

  @Column({ nullable: true })
  @Field(_type => Int, { nullable: true })
  public questionCount?: number = 0

  @Column({ nullable: true })
  @Field(_type => Int, { nullable: true })
  public approvedQuestionCount?: number = 0

  @Column({ nullable: true })
  @Field(_type => Int, { nullable: true })
  public requiredScore?: number = 0

  @Column({ type: 'jsonb', nullable: true })
  public rating?: Rating

  @ManyToMany(_type => ExamTag, tag => tag.exams)
  @JoinTable({
    name: 'examExamTags',
    joinColumn: { name: 'examId' },
    inverseJoinColumn: { name: 'examTagId' },
  })
  public tags: ExamTag[]

  @Field(_type => Boolean, { name: 'isApproved', nullable: true })
  public getIsApproved(): boolean {
    return !this.ownerId
  }
}