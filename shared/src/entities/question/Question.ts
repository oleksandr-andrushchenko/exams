import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm'
import { ObjectId } from 'bson'
import QuestionPermission from '../../enums/question/QuestionPermission'
import Base from '../Base'
import Rating from '../rating/Rating'
import QuestionType from './QuestionType'
import QuestionDifficulty from './QuestionDifficulty'
import QuestionChoice from './QuestionChoice'
import ObjectIdTransformer from '../../database/ObjectIdTransformer'
import slugify from '../../services/normalizers/SlugNormalizer'

@Entity({ name: 'questions' })
export default class Question extends Base {
  @BeforeInsert()
  @BeforeUpdate()
  private updateSlug(): void {
    this.slug = slugify(this.title, this.id.toString())
  }

  @Column({ unique: true, nullable: true })
  public slug: string

  @Column({ type: 'varchar', length: 24, transformer: ObjectIdTransformer })
  public examId: ObjectId

  @Column({ type: 'enum', enum: QuestionType })
  public type: QuestionType

  @Column({ type: 'enum', enum: QuestionDifficulty })
  public difficulty: QuestionDifficulty

  @Column({ unique: true })
  public title: string

  @Column({ nullable: true })
  public imageFilename?: string

  @Column({ type: 'jsonb', nullable: true })
  public choices?: QuestionChoice[]

  @Column({ type: 'jsonb', nullable: true })
  public rating?: Rating

  public getIsApproved(): boolean {
    return !this.ownerId
  }
}
