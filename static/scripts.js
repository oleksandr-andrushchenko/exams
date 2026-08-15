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
    const mark = $form.find('.rating-mark').val()
    if (!mark) {
      window.alert('Please select a rating.')
      return
    }
    $.ajax({
      url: $form.attr('action'),
      method: 'POST',
      headers: { Accept: 'application/json' },
      data: $form.serialize(),
      dataType: 'json'
    })
      .done((result) => {
        if (!result.ok || !result.html) {
          window.alert(result.error?.message || result.error || 'Unable to save your rating.')
          return
        }
        const $replacement = $('<form>', {
          class: $form.attr('class'),
          method: $form.attr('method'),
          action: $form.attr('action')
        }).append($(result.html.trim()))
        $form.replaceWith($replacement)
      })
      .fail((response) => {
        const result = response.responseJSON || {}
        window.alert(result.error?.message || result.error || 'Unable to save your rating.')
      })
  })
