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
import ExamTagController from './controllers/ExamTagController'
import AuthController from './controllers/AuthController'

const context = createApp(__dirname, ({ app }) => {
  const homeController = Container.get(HomeController)
  const examController = Container.get(ExamController)
  const questionController = Container.get(QuestionController)
  const userController = Container.get(UserController)
  const examTagController = Container.get(ExamTagController)
  const authController = Container.get(AuthController)

  app.use(express.urlencoded({ extended: true }))
  app.use('/static', express.static(path.resolve(__dirname, '../../static'), {
    maxAge: config.env === 'production' ? '1d' : 0
  }))

  app.get('/', controllerRoute(homeController, 'showHome', 'html'))

  app.get('/exams', controllerRoute(examController, 'indexExams', 'html'))
  app.get('/exams/new', controllerRoute(examController, 'newExam', 'html'))
  app.get('/exams/:examId/edit', controllerRoute(examController, 'editExam', 'html'))
  app.get('/exams/:examId', controllerRoute(examController, 'showExam', 'html'))

  app.get('/questions', controllerRoute(questionController, 'indexQuestions', 'html'))
  app.get('/exams/:examId/questions/new', controllerRoute(questionController, 'newQuestion', 'html'))
  app.get('/questions/:questionId/edit', controllerRoute(questionController, 'editQuestion', 'html'))
  app.get('/questions/:questionId', controllerRoute(questionController, 'showQuestion', 'html'))

  app.get('/users', controllerRoute(userController, 'indexUsers', 'html'))
  app.get('/users/:userId/edit', controllerRoute(userController, 'editUser', 'html'))
  app.get('/users/:userId', controllerRoute(userController, 'showUser', 'html'))

  app.get('/tags/:slug', controllerRoute(examTagController, 'showExamTag', 'html'))

  app.get('/login', controllerRoute(authController, 'login', 'html'))
  app.get('/register', controllerRoute(authController, 'register', 'html'))

  app.get('/:userSlug/:examSlug/:questionSlug', controllerRoute(questionController, 'showQuestionBySlugs', 'html'))
  app.get('/:userSlug/:examSlug', controllerRoute(examController, 'showExamBySlugs', 'html'))
  app.get('/:userSlug', controllerRoute(userController, 'showUserBySlug', 'html'))

  app.use((_request, _response, next) => next(new PageNotFoundError()))
})

export const handler = createLambdaHandler(context)

if (require.main === module) startApp(context, 'web').catch((error) => {
  context.logger.error(error)
  process.exit(1)
})
