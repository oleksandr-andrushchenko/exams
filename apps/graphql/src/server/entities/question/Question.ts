import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm'
import { ObjectId } from 'bson'
import { Authorized, Field, ObjectType } from 'type-graphql'
import { ObjectIdScalar } from '../../scalars/ObjectIdScalar'
import QuestionPermission from '../../enums/question/QuestionPermission'
import Base from '../Base'
import Rating from '../rating/Rating'
import QuestionType from './QuestionType'
import QuestionDifficulty from './QuestionDifficulty'
import QuestionChoice from './QuestionChoice'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'
import slugify from '../../services/normalizers/SlugNormalizer'

@ObjectType()
@Entity({ name: 'questions' })
export default class Question extends Base {
  @BeforeInsert()
  @BeforeUpdate()
  private updateSlug(): void {
    this.slug = slugify(this.title, this.id.toString())
  }

  @Column({ unique: true, nullable: true })
  @Field()
  public slug: string

  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  @Field((_type) => ObjectIdScalar)
  public examId: ObjectId

  @Column({ type: 'enum', enum: QuestionType })
  @Field()
  public type: QuestionType

  @Column({ type: 'enum', enum: QuestionDifficulty })
  @Field()
  public difficulty: QuestionDifficulty

  @Column({ unique: true })
  @Field()
  public title: string

  @Authorized(QuestionPermission.GetChoices)
  @Column({ type: 'jsonb', nullable: true })
  @Field((_type) => [QuestionChoice], { nullable: true })
  public choices?: QuestionChoice[]

  @Column({ type: 'jsonb', nullable: true })
  public rating?: Rating

  @Field((_type) => Boolean, { name: 'isApproved', nullable: true })
  public getIsApproved(): boolean {
    return !this.ownerId
  }
}
