export const errors = {
  BadRequestError: {
    types: [
      'ParamRequiredError',
      'ParamNormalizationError',
      'ValidatorError',
      'BAD_USER_INPUT',
    ],
    code: 400,
  },
  AuthorizationRequiredError: {
    types: [
      'UNAUTHENTICATED',
    ],
    code: 401,
  },
  ForbiddenError: {
    types: [
      'UNAUTHORIZED',
      'UserWrongCredentialsError',
      'AuthorizationFailedError',
    ],
    code: 403,
  },
  NotFoundError: {
    types: [
      'CategoryNotFoundError',
      'UserEmailNotFoundError',
      'QuestionNotFoundError',
      'ExamNotFoundError',
      'ExamQuestionNumberNotFoundError',
      'UserNotFoundError',
    ],
    code: 404,
  },
  ConflictError: {
    types: [
      'CategoryNameTakenError',
      'QuestionTitleTakenError',
      'ExamTakenError',
      'UserEmailTakenError',
      'CategoryNotApprovedError',
      'CategoryWithoutApprovedQuestionsError',
    ],
    code: 409,
  },
}