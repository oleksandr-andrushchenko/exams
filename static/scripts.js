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
      url: document.body.dataset.apiUrl,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        query:
          'mutation RateQuestion($questionId: ID!, $mark: Int!) { rateQuestion(questionId: $questionId, mark: $mark) { rating { html } } }',
        variables: { questionId: $form.data('question-id'), mark }
      }),
      dataType: 'json',
      xhrFields: { withCredentials: true }
    })
      .done((result) => {
        if (result.errors?.length) {
          window.alert(result.errors[0].message || 'Unable to save your rating.')
          return
        }
        const html = result.data?.rateQuestion?.rating?.html
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
      .fail((response) => window.alert(response.responseJSON?.errors?.[0]?.message || 'Unable to save your rating.'))
  })

const graphqlRequest = (query, variables) =>
  $.ajax({
    url: document.body.dataset.apiUrl,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ query, variables }),
    dataType: 'json',
    xhrFields: { withCredentials: true }
  })

const uploadImage = ($form) => {
  const file = $form.find('[name="image"]')[0]?.files?.[0]
  if (!file) return $.Deferred().resolve(undefined).promise()
  const body = new FormData()
  body.append('image', file)
  return $.ajax({
    url: document.body.dataset.apiUrl.replace(/\/graphql$/, '/upload'),
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
      graphqlRequest('mutation CreateMe($createMe: CreateMe!) { createMe(createMe: $createMe) { id } }', {
        createMe: {
          email: $form.find('[name="email"]').val(),
          password: $form.find('[name="password"]').val(),
          imageData: encodedImage
        }
      })
    )
    .done((result) => {
      if (result.errors?.length) {
        showApiError({ responseJSON: result })
        return
      }
      window.location.href = $form.data('success-url')
    })
    .fail(showApiError)
})

$(document).on('submit', '[data-api-form="createExam"]', function (event) {
  event.preventDefault()
  const $form = $(this)
  uploadImage($form)
    .then((imageFilename) =>
      graphqlRequest('mutation CreateExam($createExam: CreateExam!) { createExam(createExam: $createExam) { slug } }', {
        createExam: {
          name: $form.find('[name="name"]').val(),
          requiredScore: Number($form.find('[name="requiredScore"]').val() || 0),
          imageFilename
        }
      })
    )
    .done((result) => {
      if (result.errors?.length) {
        showApiError({ responseJSON: result })
        return
      }
      const slug = result.data?.createExam?.slug
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
      return graphqlRequest(
        'mutation Update($id: ID!, $input: Update' +
          resource +
          '!) { update' +
          resource +
          '(' +
          resource.toLowerCase() +
          'Id: $id, update' +
          resource +
          ': $input) { id } }',
        { id: $form.data('resource-id'), input }
      )
    })
    .done((result) => {
      if (result.errors?.length) {
        showApiError({ responseJSON: result })
        return
      }
      window.location.href = $form.data('success-url')
    })
    .fail(showApiError)
})
