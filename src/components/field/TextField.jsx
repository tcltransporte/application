import React from 'react'
import MuiTextField from '@mui/material/TextField'

const TextField = (props) => {

  const rawError = (props.form?.touched?.[props.field?.name] || props.form?.submitCount > 0) ? props.form?.errors?.[props.field?.name] : undefined
  const errorMessage = rawError && rawError !== `${props.field?.name} is a required field` ? rawError : undefined
  const showError = Boolean(rawError)

  const handleChange = (e) => {

    let val = e.target.value

    if (!(props.type === 'date' || props.type === 'datetime-local' || props.type === 'time')) {
      if (props.transform === 'uppercase') val = val.toUpperCase()
      else if (props.transform === 'lowercase') val = val.toLowerCase()
    }

    props.form?.setFieldValue(props.field?.name, val)

    props.onChange?.(val)

  }

  return (
    <MuiTextField
      autoComplete="off"
      {...props.field}
      {...props}
      value={props.field?.value || ''}
      onChange={handleChange}
      error={showError}
      helperText={errorMessage}
      slotProps={{
        input: {
          readOnly: props.readOnly
        },
        formHelperText: {
          sx: {
            display: errorMessage ? 'block' : 'none',
          },
        },
      }}
    />
  )
}

export default TextField