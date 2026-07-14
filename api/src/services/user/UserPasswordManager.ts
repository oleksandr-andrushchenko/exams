import { Service } from 'typedi'
import User from '../../entities/user/User'
import * as bcrypt from 'bcrypt'

@Service()
export default class UserPasswordManager {
  public async hashUserPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return reject(err)
        }

        resolve(hash)
      })
    })
  }

  public async compareUserPassword(user: User, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      bcrypt.compare(password, user.password, (_, res) => {
        resolve(res === true)
      })
    })
  }
}