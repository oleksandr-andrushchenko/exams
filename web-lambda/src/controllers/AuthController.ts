import { Service } from 'typedi'
import { type Request, type Response } from 'express'
import config from '../../../shared/src/config'

@Service()
export default class AuthController {
  public async getLoginPage(request: Request, response: Response): Promise<void> {
    const value = request.query.redirect
    const target = typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
    response.render('login.html', { title: 'Login', redirect: target, autoLogin: config.env === 'development' })
  }

  public getRegisterPage(_request: Request, response: Response): void {
    response.render('register.html', { title: 'Register' })
  }
}
