import { Column, Entity } from 'typeorm'
import Permission from '../../enums/Permission'
import { Authorized, Field, ObjectType } from 'type-graphql'
import Base from '../Base'
import UserPermission from '../../enums/user/UserPermission'
import { ObjectId } from 'mongodb'

@ObjectType()
@Entity({ name: 'users' })
export default class User extends Base {

  @Column()
  @Field({ nullable: true })
  public name?: string

  @Authorized(UserPermission.GetEmail)
  @Column({ unique: true })
  @Field({ nullable: true })
  public email?: string

  @Column()
  public password: string

  @Authorized(UserPermission.GetPermissions)
  @Column({ type: 'set', enum: Permission, default: [ Permission.Regular ] })
  @Field(_type => [ String! ], { nullable: true, defaultValue: [ Permission.Regular ] })
  public permissions?: Permission[] = [ Permission.Regular ]

  @Column()
  public categoryRatingMarks?: ObjectId[][]

  @Column()
  public questionRatingMarks?: ObjectId[][]

  @Column()
  public categoryExams?: { [key: string]: ObjectId }
}