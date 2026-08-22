import path from 'node:path'
import express from 'express'
import { Container } from 'typedi'
import { controllerRoute } from '../../shared/src/http'
import config from '../../shared/src/config'
import PageNotFoundError from '../../shared/src/errors/PageNotFoundError'
import { createApp, createLambdaHandler, startApp } from '../../shared/src/app'
import HomeController from './controllers/HomeController'
import ExamController from './controllers/ExamController'
import QuestionController from './controllers/QuestionController'
import UserController from './controllers/UserController'
import TagController from './controllers/TagController'
import AuthController from './controllers/AuthController'

const context = createApp(__dirname, ({ app }) => {
  const homeController = Container.get(HomeController)
  const examController = Container.get(ExamController)
  const questionController = Container.get(QuestionController)
  const userController = Container.get(UserController)
  const tagController = Container.get(TagController)
  const authController = Container.get(AuthController)

  app.use(express.urlencoded({ extended: true }))
  app.use('/static', express.static(path.resolve(__dirname, '../../static'), {
    maxAge: config.env === 'production' ? '1d' : 0
  }))

  app.get('/', controllerRoute(homeController, 'getHome', 'html'))

  app.get('/exams', controllerRoute(examController, 'listExams', 'html'))
  app.get('/exams/new', controllerRoute(examController, 'createExamPage', 'html'))
  app.get('/exams/:examId/edit', controllerRoute(examController, 'editExam', 'html'))
  app.get('/exams/:examId', controllerRoute(examController, 'getExam', 'html'))

  app.get('/questions', controllerRoute(questionController, 'listQuestions', 'html'))
  app.get('/questions/new', controllerRoute(questionController, 'createQuestionPage', 'html'))
  app.get('/questions/:questionId/edit', controllerRoute(questionController, 'editQuestion', 'html'))
  app.get('/questions/:questionId', controllerRoute(questionController, 'getQuestion', 'html'))

  app.get('/users', controllerRoute(userController, 'listUsers', 'html'))
  app.get('/users/:userId/edit', controllerRoute(userController, 'editUser', 'html'))
  app.get('/users/:userId', controllerRoute(userController, 'getUser', 'html'))

  app.get('/tags/:slug', controllerRoute(tagController, 'getTag', 'html'))

  app.get('/login', controllerRoute(authController, 'getLoginPage', 'html'))
  app.get('/register', controllerRoute(authController, 'getRegisterPage', 'html'))

  app.get('/:userSlug/:examSlug/:questionSlug', controllerRoute(questionController, 'getPublicQuestion', 'html'))
  app.get('/:userSlug/:examSlug', controllerRoute(examController, 'getPublicExam', 'html'))
  app.get('/:userSlug', controllerRoute(userController, 'getPublicUser', 'html'))

  app.use((_request, _response, next) => next(new PageNotFoundError()))
})

export const handler = createLambdaHandler(context)

if (require.main === module) startApp(context, 'web').catch((error) => {
  context.logger.error(error)
  process.exit(1)
})
