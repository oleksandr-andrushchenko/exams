export const errors = {
  BadRequestError: {
    types: ['ParamRequiredError', 'ParamNormalizationError', 'ValidatorError', 'QuestionTypeError', 'BAD_USER_INPUT'],
    code: 400
  },
  AuthorizationRequiredError: {
    types: ['UNAUTHENTICATED', 'AuthenticationFailedError', 'UserWrongCredentialsError'],
    code: 401
  },
  ForbiddenError: {
    types: ['UNAUTHORIZED', 'AuthorizationFailedError'],
    code: 403
  },
  NotFoundError: {
    types: [
      'ExamNotFoundError',
      'UserEmailNotFoundError',
      'QuestionNotFoundError',
      'ExamSessionNotFoundError',
      'ExamSessionQuestionNumberNotFoundError',
      'UserNotFoundError',
      'PageNotFoundError'
    ],
    code: 404
  },
  ConflictError: {
    types: [
      'ExamNameTakenError',
      'QuestionTitleTakenError',
      'ExamSessionTakenError',
      'UserEmailTakenError',
      'ExamNotApprovedError',
      'ExamWithoutApprovedQuestionsError',
      'ExamRatedAlready',
      'QuestionRatedAlready'
    ],
    code: 409
  }
}

export const getErrorStatus = (error: unknown): number => {
  const types = error instanceof Error ? [error.name, error.constructor.name] : []
  for (const definition of Object.values(errors)) {
    if (types.some((type) => definition.types.includes(type))) return definition.code
  }
  return 500
}
