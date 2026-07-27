import { Input } from '@/components/bootstrap'
import { KeyboardEvent, useEffect, useState } from 'react'
import { useField } from 'formik'
import { apiQuery } from '../../client/graphql/apolloClient'
import getExamTags from '../../client/graphql/examTag/getExamTags'
import ExamTag from '../../schema/examTag/ExamTag'
import Error from '../Error'
import Button from '../elements/Button'

interface Props {
  name: string
  label: string
  max?: number
}

export default function FormikTagAutocomplete({name, label, max = 10}: Props) {
  const [field, meta, helpers] = useField<string[]>(name)
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<ExamTag[]>([])
  const tags = field.value || []

  useEffect(() => {
    const timer = window.setTimeout(() => {
      apiQuery(getExamTags(text.trim()), ({examTags}: { examTags: ExamTag[] }) => {
        setSuggestions(examTags.filter(tag => !tags.some(value => value.toLowerCase() === tag.name.toLowerCase())))
      })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [text, tags.join('|')])

  const add = (value: string = text) => {
    const normalized = value.trim().replace(/\s+/g, ' ')
    if (!normalized || tags.length >= max || tags.some(tag => tag.toLowerCase() === normalized.toLowerCase())) return
    helpers.setValue([...tags, normalized])
    helpers.setTouched(true)
    setText('')
    setSuggestions([])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add()
    }
  }

  return <div className="d-flex flex-column gap-2">
    <div className="d-flex gap-2">
      <div className="position-relative flex-grow-1">
        <Input
                label={label}
                value={text}
                onChange={event => setText(event.target.value)}
                onKeyDown={onKeyDown}
                disabled={tags.length >= max}
        />
        {text && suggestions.length > 0 &&
                <div className="position-absolute z-3 mt-1 w-100 overflow-auto rounded border bg-white ">
                  {suggestions.map(tag => <button
                          key={tag.id}
                          type="button"
                          className="btn btn-link d-block w-100 text-start "
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => add(tag.name)}
                  >{tag.name} <span className="small text-secondary">({tag.examsCount})</span></button>)}
                </div>}
      </div>
      <Button type="button" label="Add" disabled={!text.trim() || tags.length >= max} onClick={() => add()}/>
    </div>

    {tags.length > 0 && <div className="d-flex flex-wrap gap-2">
      {tags.map(tag => <button
              key={tag}
              type="button"
              className="btn btn-sm btn-secondary"
              title="Remove tag"
              onClick={() => helpers.setValue(tags.filter(value => value !== tag))}
      >{tag} ×</button>)}
    </div>}

    <div className="small text-secondary">Press Enter or comma to add a tag ({tags.length}/{max}).</div>
    {meta.touched && meta.error && <Error text={String(meta.error)}/>}
  </div>
}
