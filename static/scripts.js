const setRatingPreview = (widget, mark, preview) => {
  const average = Number(widget.dataset.averageMark || 0)
  widget.querySelectorAll('.rating-star').forEach((item) => {
    const value = Number(item.value)
    const active = preview ? value <= mark : value <= average
    const icon = item.querySelector('i')
    if (!icon) return
    icon.classList.toggle('bi-star-fill', active)
    icon.classList.toggle('bi-star', !active)
    icon.classList.toggle('text-warning', active)
    icon.classList.toggle('text-secondary', !active)
    item.classList.toggle('text-warning', active)
    item.classList.toggle('text-secondary', !active)
  })
}

document.addEventListener('click', (event) => {
  const star = event.target.closest('.rating-star')
  if (!star) return
  star.closest('.rating-form').querySelector('.rating-mark').value = star.value
})

document.addEventListener('pointerover', (event) => {
  const star = event.target.closest('.rating-star')
  if (!star) return
  setRatingPreview(star.closest('[data-rating-widget]'), Number(star.value), true)
})

document.addEventListener('pointerout', (event) => {
  const control = event.target.closest('.rating-control')
  if (!control || control.contains(event.relatedTarget)) return
  const widget = control.closest('[data-rating-widget]')
  setRatingPreview(widget, Number(widget.dataset.averageMark || 0), false)
})

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('.rating-form')
  if (!form) return
  event.preventDefault()
  const body = new URLSearchParams(new FormData(form))
  if (event.submitter?.name) body.set(event.submitter.name, event.submitter.value)
  if (!body.get('mark')) {
    window.alert('Please select a rating.')
    return
  }
  const response = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body })
  const result = await response.json()
  if (!response.ok || !result.ok || !result.html) {
    window.alert(result.error?.message || result.error || 'Unable to save your rating.')
    return
  }
  const template = document.createElement('template')
  template.innerHTML = result.html.trim()
  const replacement = document.createElement('form')
  replacement.className = form.className
  replacement.method = form.method
  replacement.action = form.action
  replacement.append(...template.content.childNodes)
  form.replaceWith(replacement)
})
