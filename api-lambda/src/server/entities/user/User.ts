import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm'
import Permission from '../../enums/Permission'
import { Authorized, Field, ObjectType } from 'type-graphql'
import Base from '../Base'
import UserPermission from '../../enums/user/UserPermission'
import { ObjectId } from 'bson'
import ObjectIdJsonTransformer from '../../database/ObjectIdJsonTransformer'
import Rating from '../rating/Rating'
import slugify from '../../services/normalizers/SlugNormalizer'

@ObjectType()
@Entity({ name: 'users' })
export default class User extends Base {
  @BeforeInsert()
  @BeforeUpdate()
  private updateSlug(): void {
    this.slug = slugify(this.name, this.id.toString())
  }

  @Column({ unique: true, nullable: true })
  @Field({ nullable: true })
  public slug?: string

  @Column({ nullable: true })
  @Field({ nullable: true })
  public name?: string

  @Column({ nullable: true })
  @Field({ nullable: true })
  public imageFilename?: string

  @Authorized(UserPermission.GetEmail)
  @Column({ unique: true, nullable: true })
  @Field({ nullable: true })
  public email?: string

  @Column()
  public password: string

  @Authorized(UserPermission.GetPermissions)
  @Column({ type: 'text', array: true, default: [Permission.Regular] })
  @Field((_type) => [String!], { nullable: true, defaultValue: [Permission.Regular] })
  public permissions?: Permission[] = [Permission.Regular]

  @Column({ type: 'jsonb', nullable: true })
  public rating?: Rating

  @Column({ type: 'jsonb', nullable: true, transformer: ObjectIdJsonTransformer })
  public examRatingMarks?: ObjectId[][]

  @Column({ type: 'jsonb', nullable: true, transformer: ObjectIdJsonTransformer })
  public questionRatingMarks?: ObjectId[][]

  @Column({ type: 'jsonb', nullable: true, transformer: ObjectIdJsonTransformer })
  public examExamSessions?: { [key: string]: ObjectId }
}
