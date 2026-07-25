import { Input } from '@material-tailwind/react'
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

export default function FormikTagAutocomplete({ name, label, max = 10 }: Props) {
  const [ field, meta, helpers ] = useField<string[]>(name)
  const [ text, setText ] = useState('')
  const [ suggestions, setSuggestions ] = useState<ExamTag[]>([])
  const tags = field.value || []

  useEffect(() => {
    const timer = window.setTimeout(() => {
      apiQuery(getExamTags(text.trim()), ({ examTags }: { examTags: ExamTag[] }) => {
        setSuggestions(examTags.filter(tag => !tags.some(value => value.toLowerCase() === tag.name.toLowerCase())))
      })
    }, 200)
    return () => window.clearTimeout(timer)
  }, [ text, tags.join('|') ])

  const add = (value: string = text) => {
    const normalized = value.trim().replace(/\s+/g, ' ')
    if (!normalized || tags.length >= max || tags.some(tag => tag.toLowerCase() === normalized.toLowerCase())) return
    helpers.setValue([ ...tags, normalized ])
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

  return <div className="flex flex-col gap-2">
    <div className="flex gap-2">
      <div className="relative grow">
        <Input
          label={ label }
          value={ text }
          onChange={ event => setText(event.target.value) }
          onKeyDown={ onKeyDown }
          disabled={ tags.length >= max }
        />
        { text && suggestions.length > 0 && <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-lg">
          { suggestions.map(tag => <button
            key={ tag.id }
            type="button"
            className="block w-full px-3 py-2 text-left hover:bg-blue-gray-50"
            onMouseDown={ event => event.preventDefault() }
            onClick={ () => add(tag.name) }
          >{ tag.name } <span className="text-xs text-blue-gray-500">({ tag.examsCount })</span></button>) }
        </div> }
      </div>
      <Button type="button" label="Add" disabled={ !text.trim() || tags.length >= max } onClick={ () => add() }/>
    </div>

    { tags.length > 0 && <div className="flex flex-wrap gap-2">
      { tags.map(tag => <button
        key={ tag }
        type="button"
        className="rounded-full bg-blue-gray-100 px-3 py-1 text-sm"
        title="Remove tag"
        onClick={ () => helpers.setValue(tags.filter(value => value !== tag)) }
      >{ tag } ×</button>) }
    </div> }

    <div className="text-xs text-blue-gray-500">Press Enter or comma to add a tag ({ tags.length }/{ max }).</div>
    { meta.touched && meta.error && <Error text={ String(meta.error) }/> }
  </div>
}
