import { config, renderRoute, within } from '../../index'

describe('Login page', () => {
  config()

  test('initial state', () => {
    const { getByRole } = renderRoute('/login')
    expect(getByRole('heading', { name: /login/i })).toBeVisible()
    const form = document.querySelector('form') as HTMLFormElement
    expect(form).not.toBeNull()
    expect(within(form).getByLabelText(/email/i)).toBeVisible()
    expect(within(form).getByLabelText(/^password/i)).toBeVisible()
    expect(within(form).getByRole('button', { name: /login/i })).toBeEnabled()
  })
})
