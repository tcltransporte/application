import React from 'react'
import { useField, useFormikContext } from 'formik'
import MuiTextField from '@mui/material/TextField'

const NumericField = ({ name, decimalPlaces = 2, ...props }) => {
  const [field, meta] = useField(name)
  const { setFieldValue } = useFormikContext()

  const formatValue = (raw) => {
    if (!raw) return ''
    const digits = String(raw).replace(/\D/g, '')
    const num = BigInt(digits || '0')
    const divisor = BigInt(10 ** decimalPlaces)
    const intPart = num / divisor
    const decPart = num % divisor
    const integerStr = intPart
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${integerStr},${decPart.toString().padStart(decimalPlaces, '0')}`
  }

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setFieldValue(name, raw)
  }

  return (
    <MuiTextField
      {...field}
      {...props}
      value={formatValue(field.value)}
      onChange={handleChange}
      error={Boolean(meta.touched && meta.error)}
      helperText={meta.touched && meta.error}
      slotProps={{input: { inputMode: 'decimal' }}}
    />
  )
}

export default NumericField
