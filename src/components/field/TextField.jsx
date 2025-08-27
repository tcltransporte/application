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
  const { touched, errors } = form
  const error = touched?.[name] && Boolean(errors?.[name])
  const helperText = touched?.[name] && errors?.[name]

  const handleChange = (e) => {

    let val = e.target.value

    if (rest.type === 'date' || rest.type === 'datetime-local' || rest.type === 'time') {
      val = val
    } else {
      if (transform === 'uppercase') {
        val = val.toUpperCase()
      } else if (transform === 'lowercase') {
        val = val.toLowerCase()
      }
    }

    if (props.form?.setFieldValue) {
      props.form?.setFieldValue(props.field?.name, val)
    }

    if (props.onChange) {
      props.onChange(val)
    }

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
