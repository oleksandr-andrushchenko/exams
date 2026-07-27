import { ComponentProps, memo } from 'react'
import Spinner from '../Spinner'

interface Props extends ComponentProps<any> {
  className?: string
  title?: string
  columns: string[]
  source: object | undefined
  mapper: Function
  key2?: number
}

const InfoTable = ({className = '', title, columns, source, mapper, key2 = 1}: Props) => {
  const data = source ? mapper(source) : {}

  return (
          <table className={`w-100 table-layout-fixed text-start small ${className}`}>
            {title && <legend>{title}</legend>}
            <tbody>
            {columns.map((column, index) => (
                    <tr key={`${column}-${data[index] ?? ''}-${key2}`}>
                      <th className="col-2">{column}</th>
                      <td>{data ? data[index] : <Spinner type="text"/>}</td>
                    </tr>
            ))}
            </tbody>
          </table>
  )
}

export default memo(InfoTable)