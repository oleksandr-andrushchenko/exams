import { config, renderRoute, within } from '../../index'

describe('Register page', () => {
  config()

  test('initial state', () => {
    const { getByRole } = renderRoute('/register')
    expect(getByRole('heading', { name: /register/i })).toBeVisible()
    const form = document.querySelector('form') as HTMLFormElement
    expect(form).not.toBeNull()
    expect(within(form).getByLabelText(/email/i)).toBeVisible()
    expect(within(form).getByLabelText(/^password/i)).toBeVisible()
    const confirmPasswordInput = within(form).getByLabelText(/confirm password/i)
    expect(confirmPasswordInput).toBeVisible()
    expect(within(form).getByRole('button', { name: /register/i })).toBeEnabled()
  })
})
