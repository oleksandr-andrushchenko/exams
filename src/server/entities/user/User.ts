import { Column, Entity } from 'typeorm'
import Permission from '../../enums/Permission'
import { Authorized, Field, ObjectType } from 'type-graphql'
import Base from '../Base'
import UserPermission from '../../enums/user/UserPermission'
import { ObjectId } from 'bson'
import ObjectIdJsonTransformer from '../../database/ObjectIdJsonTransformer'

@ObjectType()
@Entity({ name: 'users' })
export default class User extends Base {

  @Column({ nullable: true })
  @Field({ nullable: true })
  public name?: string

  @Authorized(UserPermission.GetEmail)
  @Column({ unique: true, nullable: true })
  @Field({ nullable: true })
  public email?: string

  @Column()
  public password: string

  @Authorized(UserPermission.GetPermissions)
  @Column({ type: 'text', array: true, default: [ Permission.Regular ] })
  @Field(_type => [ String! ], { nullable: true, defaultValue: [ Permission.Regular ] })
  public permissions?: Permission[] = [ Permission.Regular ]

  @Column({ type: 'jsonb', nullable: true, transformer: ObjectIdJsonTransformer })
  public examRatingMarks?: ObjectId[][]

  @Column({ type: 'jsonb', nullable: true, transformer: ObjectIdJsonTransformer })
  public questionRatingMarks?: ObjectId[][]

  @Column({ type: 'jsonb', nullable: true, transformer: ObjectIdJsonTransformer })
  public examExamSessions?: { [key: string]: ObjectId }
}