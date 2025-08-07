import React from 'react'
import MuiTextField from '@mui/material/TextField'

const TextField = (props) => {
  const {
    field,
    form,
    transform = 'none',
    InputProps,
    readOnly = false,
    ...rest
  } = props

  if (!field) {
    return (
      <MuiTextField
        {...props}
        InputProps={{
          ...InputProps,
          readOnly,
        }}
      />
    )
  }

  const { name, value } = field
  const { touched, errors, setFieldValue } = form
  const error = touched?.[name] && Boolean(errors?.[name])
  const helperText = touched?.[name] && errors?.[name]

  const handleChange = (e) => {
    let val = e.target.value

    if (rest.type === 'date' || rest.type === 'datetime-local' || rest.type === 'time') {
      setFieldValue(name, val)
      return
    }

    if (transform === 'uppercase') {
      val = val.toUpperCase()
    } else if (transform === 'lowercase') {
      val = val.toLowerCase()
    }

    setFieldValue(name, val)
  }

  return (
    <MuiTextField
      {...field}
      {...rest}
      value={value || ''}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      InputProps={{
        ...InputProps,
        readOnly,
      }}
    />
  )
}

export default TextField
