import { FieldArray, useField } from 'formik'
import Error from '../Error'
import Button from '../elements/Button'
import { CreateIcon, DeleteIcon } from '../../registry/icons'
import FormikSelect from './FormikSelect'
import { ComponentProps } from 'react'

interface Props extends ComponentProps<any> {
  name: string
  label: string
  whitelist: string[]
}

export default function FormikTags({name, label, whitelist}: Props) {
  const [input, meta] = useField(name)
  const {value} = input
  const {touched, error} = meta

  const options = whitelist.map(item => ({value: item, label: item}))

  return (
          <div className="d-flex flex-column gap-1">
            <FieldArray name={name}>
              {({remove, push}) => (
                      <div className="d-flex flex-column gap-3">
                        {value.map((_tag: any, index: number) => (
                                <div key={`${name}.${index}`} className="d-grid gap-1">

                                  <FormikSelect
                                          name={`${name}.${index}`}
                                          label={`${label} #${index + 1}`}
                                          options={options}
                                  />

                                  {value.length > 1 && (
                                          <div>
                                            <Button
                                                    icon={DeleteIcon}
                                                    label="Remove"
                                                    onClick={() => remove(index)}
                                            />
                                          </div>
                                  )}
                                </div>
                        ))}
                        <div>
                          <Button
                                  icon={CreateIcon}
                                  label="Add"
                                  type="button"
                                  onClick={() => push('_')}
                          />
                        </div>
                      </div>
              )}
            </FieldArray>

            {touched && error && <Error text={[...new Set(error)].filter(error => !!error).join(', ')}/>}
          </div>
  )
};