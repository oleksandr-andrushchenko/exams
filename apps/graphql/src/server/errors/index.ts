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
      'ExamNotFoundError',
      'UserEmailNotFoundError',
      'QuestionNotFoundError',
      'ExamSessionNotFoundError',
      'ExamSessionQuestionNumberNotFoundError',
      'UserNotFoundError',
    ],
    code: 404,
  },
  ConflictError: {
    types: [
      'ExamNameTakenError',
      'QuestionTitleTakenError',
      'ExamSessionTakenError',
      'UserEmailTakenError',
      'ExamNotApprovedError',
      'ExamWithoutApprovedQuestionsError',
    ],
    code: 409,
  },
}