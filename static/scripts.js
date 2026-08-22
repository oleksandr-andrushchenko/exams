const setRatingPreview = ($widget, mark, preview) => {
  const average = Number($widget.attr('data-average-mark') || 0)
  $widget.find('.rating-star').each(function () {
    const $item = $(this)
    const active = preview ? Number($item.val()) <= mark : Number($item.val()) <= average
    const $icon = $item.find('i')
    $icon.toggleClass('bi-star-fill', active)
    $icon.toggleClass('bi-star', !active)
    $icon.toggleClass('text-warning', active)
    $icon.toggleClass('text-secondary', !active)
    $item.toggleClass('text-warning', active)
    $item.toggleClass('text-secondary', !active)
  })
}

$(document)
  .on('click', '.rating-star', function () {
    $(this).closest('.rating-form').find('.rating-mark').val($(this).val())
  })
  .on('pointerover', '.rating-star', function () {
    setRatingPreview($(this).closest('[data-rating-widget]'), Number($(this).val()), true)
  })
  .on('pointerout', '.rating-control', function (event) {
    if ($(this).has(event.relatedTarget).length) return
    const $widget = $(this).closest('[data-rating-widget]')
    setRatingPreview($widget, Number($widget.attr('data-average-mark') || 0), false)
  })
  .on('submit', '.rating-form', function (event) {
    event.preventDefault()
    const $form = $(this)
    const mark = Number($form.find('.rating-mark').val())
    if (!mark) {
      window.alert('Please select a rating.')
      return
    }
    $.ajax({
      url: apiEndpoint('/questions/' + $form.data('question-id') + '/rating'),
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ mark }),
      dataType: 'json',
      xhrFields: { withCredentials: true }
    })
      .done((result) => {
        const html = result.html
        if (!html) {
          window.alert('Unable to save your rating.')
          return
        }
        const $replacement = $('<form>', {
          class: $form.attr('class'),
          method: 'post',
          'data-question-id': $form.data('question-id')
        }).append($(html.trim()))
        $form.replaceWith($replacement)
      })
      .fail(showApiError)
  })

const apiEndpoint = (path) => document.body.dataset.apiUrl.replace(/\/$/, '') + path

const uploadImage = ($form) => {
  const file = $form.find('[name="image"]')[0]?.files?.[0]
  if (!file) return $.Deferred().resolve(undefined).promise()
  const body = new FormData()
  body.append('image', file)
  return $.ajax({
    url: apiEndpoint('/upload'),
    method: 'POST',
    data: body,
    processData: false,
    contentType: false,
    dataType: 'json',
    xhrFields: { withCredentials: true }
  }).then((result) => result.filename)
}

const showApiError = (response) => {
  const error = response.responseJSON?.errors?.[0] || response.responseJSON?.error
  window.alert(error?.message || error || 'Request failed.')
}

$(document).on('click', '[data-api-form="login"] button', function (event) {
  event.preventDefault()
  const $form = $(this).closest('[data-api-form="login"]')
  const email = $form.find('[name="email"]')[0]
  const password = $form.find('[name="password"]')[0]
  const autoLogin = $form.data('auto-login') === true || $form.data('auto-login') === 'true'
  if (!autoLogin && (!email.checkValidity() || !password.checkValidity())) {
    email.reportValidity()
    password.reportValidity()
    return
  }
  $.ajax({
    url: apiEndpoint('/login'),
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      ...(autoLogin
        ? { autoLogin: true }
        : {
            email: $form.find('[name="email"]').val(),
            password: $form.find('[name="password"]').val()
          }),
      redirect: $form.find('[name="redirect"]').val()
    }),
    dataType: 'json',
    xhrFields: { withCredentials: true }
  })
    .done((result) => {
      window.location.href = result.redirect || '/'
    })
    .fail(showApiError)
})

$(function () {
  const $form = $('[data-api-form="login"]')
  if ($form.data('auto-login') === true || $form.data('auto-login') === 'true') {
    $form.find('button').trigger('click')
  }
})

$(document).on('click', '[data-api-form="logout"]', function (event) {
  event.preventDefault()
  $.ajax({
    url: apiEndpoint('/logout'),
    method: 'POST',
    dataType: 'json',
    xhrFields: { withCredentials: true }
  })
    .done((result) => {
      window.location.href = result.redirect || '/'
    })
    .fail(showApiError)
})

$(document).on('submit', '[data-api-form="createMe"]', function (event) {
  event.preventDefault()
  const $form = $(this)
  const file = $form.find('[name="image"]')[0]?.files?.[0]
  const imageData = file
    ? new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    : Promise.resolve(undefined)
  imageData
    .then((encodedImage) =>
      $.ajax({
        url: apiEndpoint('/me'),
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          email: $form.find('[name="email"]').val(),
          password: $form.find('[name="password"]').val(),
          imageData: encodedImage
        }),
        dataType: 'json',
        xhrFields: { withCredentials: true }
      })
    )
    .done((result) => {
      window.location.href = $form.data('success-url')
    })
    .fail(showApiError)
})

$(document).on('submit', '[data-api-form="createExam"]', function (event) {
  event.preventDefault()
  const $form = $(this)
  uploadImage($form)
    .then((imageFilename) =>
      $.ajax({
        url: apiEndpoint('/exams'),
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          name: $form.find('[name="name"]').val(),
          requiredScore: Number($form.find('[name="requiredScore"]').val() || 0),
          imageFilename
        }),
        dataType: 'json',
        xhrFields: { withCredentials: true }
      })
    )
    .done((result) => {
      const slug = result.slug
      if (slug) window.location.href = $form.data('success-url').replace('__SLUG__', encodeURIComponent(slug))
    })
    .fail(showApiError)
})

$(document).on('click', '.add-choice', function () {
  const $choices = $(this).siblings('.choices')
  const number = $choices.find('.choice').length + 1
  $choices.append(`
    <div class="choice border rounded p-2">
      <div class="d-flex gap-2">
        <label class="flex-grow-1">Choice ${number}<textarea class="form-control" maxlength="3000" minlength="10" name="choiceTitle" required></textarea></label>
        <button class="btn btn-outline-danger align-self-start remove-choice" type="button">Remove</button>
      </div>
      <label class="form-check"><input class="form-check-input" name="choiceCorrect" type="checkbox" value="true"> Correct answer</label>
    </div>
  `)
})

$(document).on('click', '.remove-choice', function () {
  const $choices = $(this).closest('.choices')
  if ($choices.find('.choice').length <= 2) return
  $(this).closest('.choice').remove()
  $choices.find('.choice').each(function (index) {
    $(this).find('label').first().contents().first()[0].textContent = 'Choice ' + (index + 1)
  })
})

$(document).on('submit', '[data-api-form="createQuestion"]', function (event) {
  event.preventDefault()
  const $form = $(this)
  const submitAction = event.originalEvent?.submitter?.dataset.submitAction || 'finish'
  const choices = $form
    .find('.choice')
    .map(function () {
      const $choice = $(this)
      return {
        title: $choice.find('[name="choiceTitle"]').val(),
        correct: $choice.find('[name="choiceCorrect"]').is(':checked')
      }
    })
    .get()
  $.ajax({
    url: apiEndpoint('/questions'),
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      examId: $form.find('[name="examId"]').val(),
      title: $form.find('[name="title"]').val(),
      difficulty: $form.find('[name="difficulty"]:checked').val(),
      type: $form.find('[name="type"]').val(),
      choices
    }),
    dataType: 'json',
    xhrFields: { withCredentials: true }
  })
    .done((result) => {
      if (submitAction === 'next') {
        $form[0].reset()
        $form.find('.choice').slice(2).remove()
        $form.find('[name="difficulty"][value="moderate"]').prop('checked', true)
        $form.find('[name="title"]').trigger('focus')
        return
      }
      const slug = result.slug
      if (slug) window.location.href = $form.data('success-url').replace('__SLUG__', encodeURIComponent(slug))
    })
    .fail(showApiError)
})

$(document).on('submit', '[data-api-form^="update"]', function (event) {
  event.preventDefault()
  const $form = $(this)
  const resource = String($form.data('api-form')).replace('update', '')
  const input = {}
  $form.serializeArray().forEach(({ name, value }) => {
    if (name !== 'image') input[name] = name === 'requiredScore' ? Number(value) : value
  })
  uploadImage($form)
    .then((imageFilename) => {
      if (imageFilename) input.imageFilename = imageFilename
      const endpoint = resource === 'User' ? 'users' : resource === 'Exam' ? 'exams' : 'questions'
      return $.ajax({
        url: apiEndpoint('/' + endpoint + '/' + $form.data('resource-id')),
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify(input),
        dataType: 'json',
        xhrFields: { withCredentials: true }
      })
    })
    .done((result) => {
      window.location.href = $form.data('success-url')
    })
    .fail(showApiError)
})
