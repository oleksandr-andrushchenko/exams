'use client'

import { type ComponentProps, createContext, type ReactNode, useContext, useEffect, useState } from 'react'

type AnyProps = Record<string, any> & { children?: ReactNode }

const tagFor = (as: any, fallback: keyof JSX.IntrinsicElements) => as || fallback

export function Typography({as, variant, color, className = '', children, ...props}: AnyProps) {
  const Tag = tagFor(as, variant?.startsWith('h') ? variant : 'span') as any
  const colorClass = color === 'red' ? 'text-danger' : color === 'gray' || color === 'blue-gray' ? 'text-secondary' : ''
  return <Tag className={`${colorClass} ${className}`.trim()} {...props}>{children}</Tag>
}

export function Button({variant, color, size, className = '', children, label, ...props}: AnyProps) {
  const variantClass = variant === 'text' ? 'btn-link' : variant === 'outlined' ? 'btn-outline-secondary' : `btn-${color === 'red' ? 'danger' : color === 'green' ? 'success' : color === 'secondary' ? 'secondary' : 'primary'}`
  return <button
          className={`btn ${variantClass} ${size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : ''} ${className}`.trim()} {...props}>{label || children}</button>
}

export function IconButton({icon, children, ...props}: AnyProps) {
  return <Button {...props}>{icon ? <>{ReactIcon(icon)} </> : null}{children}</Button>
}

function ReactIcon(icon: any) {
  return typeof icon === 'function' ? icon({}) : null
}

export function Tooltip({children}: AnyProps) {
  return <>{children}</>
}

export function Card({children, className = '', ...props}: AnyProps) {
  return <div className={`card ${className}`.trim()} {...props}>{children}</div>
}

export function CardBody({children, className = '', ...props}: AnyProps) {
  return <div className={`card-body ${className}`.trim()} {...props}>{children}</div>
}

export function CardFooter({children, className = '', ...props}: AnyProps) {
  return <div className={`card-footer ${className}`.trim()} {...props}>{children}</div>
}

export function Dialog({open, handler, children, className = ''}: AnyProps) {
  if (!open) return null
  return <div className="modal d-block" role="dialog" onClick={handler}>
    <div className={`modal-dialog modal-dialog-centered ${className}`.trim()}
         onClick={event => event.stopPropagation()}>
      <div className="modal-content">{children}</div>
    </div>
  </div>
}

const TabsContext = createContext<{ value?: string, setValue: (value: string) => void }>({
  setValue: () => {
  }
})

export function Tabs({value, children}: AnyProps) {
  const [active, setActive] = useState(value);
  useEffect(() => setActive(value), [value]);
  return <TabsContext.Provider value={{value: active, setValue: setActive}}>{children}</TabsContext.Provider>
}

export function TabsHeader({children, ...props}: AnyProps) {
  return <div className="nav nav-tabs" {...props}>{children}</div>
}

export function Tab({value, children, ...props}: AnyProps) {
  const tabs = useContext(TabsContext);
  return <button type="button" className={`nav-link ${tabs.value === value ? 'active' : ''}`}
                 onClick={() => tabs.setValue(value)} {...props}>{children}</button>
}

export function TabsBody({children}: AnyProps) {
  return <div className="tab-content pt-3">{children}</div>
}

export function TabPanel({value, children}: AnyProps) {
  const tabs = useContext(TabsContext);
  return tabs.value === value ? <div className="tab-pane active">{children}</div> : null
}

export function Navbar({children, className = '', ...props}: AnyProps) {
  return <nav className={`navbar ${className}`.trim()} {...props}>{children}</nav>
}

export function Collapse({open, children}: AnyProps) {
  return open ? <div>{children}</div> : null
}

export function Breadcrumbs({children}: AnyProps) {
  return <nav aria-label="breadcrumb">
    <ol className="breadcrumb">{Children.map(children, (item, index) => <li key={index}
                                                                            className="breadcrumb-item">{item}</li>)}</ol>
  </nav>
}

export function Chip({value, children, className = '', ...props}: AnyProps) {
  return <span className={`badge text-bg-secondary ${className}`.trim()} {...props}>{value || children}</span>
}

export function ButtonGroup({children, className = '', ...props}: AnyProps) {
  return <div className={`btn-group ${className}`.trim()} {...props}>{children}</div>
}

export function Input({label, error, success, className = '', ...props}: AnyProps) {
  return <div><label className="form-label">{label}</label><input
          className={`form-control ${error ? 'is-invalid' : success ? 'is-valid' : ''} ${className}`.trim()} {...props} />
  </div>
}

export function Textarea({label, ...props}: AnyProps) {
  return <div><label className="form-label">{label}</label><textarea className="form-control" {...props} /></div>
}

export function Select({label, children, ...props}: AnyProps) {
  return <div><label className="form-label">{label}</label><select
          className="form-select" {...props}>{children}</select></div>
}

export function Option({children, ...props}: AnyProps) {
  return <option {...props}>{children}</option>
}

export function Checkbox({label, ...props}: AnyProps) {
  return <label className="form-check d-flex gap-2"><input type="checkbox"
                                                           className="form-check-input" {...props} />{label}</label>
}

export function Progress({value = 0}: AnyProps) {
  return <div className="progress">
    <div className="progress-bar" style={{width: `${value}%`}}/>
  </div>
}

export function Rating({value = 0, count = 5, onChange, ratedIcon, unratedIcon, readonly}: AnyProps) {
  return <span className="d-inline-flex gap-1">{Array.from({length: count}, (_, index) => <button key={index}
                                                                                                  type="button"
                                                                                                  className="btn btn-link p-0"
                                                                                                  disabled={readonly}
                                                                                                  onClick={() => onChange?.(index + 1)}>{index < value ? ratedIcon : unratedIcon}</button>)}</span>
}

export function Spinner({className = ""}: AnyProps) {
  return <span className={`spinner-border spinner-border-sm ${className}`.trim()} role="status" aria-label="Loading"/>
}

export function ThemeProvider({children}: { children: ReactNode }) {
  return <>{children}</>
}

export type InputProps = ComponentProps<'input'>
