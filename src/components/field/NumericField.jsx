import React from 'react'
import { useField, useFormikContext } from 'formik'
import MuiTextField from '@mui/material/TextField'

const NumericField = ({ name, decimalPlaces = 2, ...props }) => {
  const [field, meta] = useField(name)
  const { setFieldValue } = useFormikContext()

  const formatValue = (value) => {
    if (value === '' || value === null || isNaN(value)) return ''
    const fixed = Number(value).toFixed(decimalPlaces)
    const [intPart, decPart] = fixed.split('.')
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formattedInt},${decPart}`
  }

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    const num = BigInt(raw || '0')
    const divisor = BigInt(10 ** decimalPlaces)
    const decimalValue = Number(num) / Number(divisor)
    setFieldValue(name, decimalValue)
  }

  return (
    <MuiTextField
      {...field}
      {...props}
      value={formatValue(field.value)}
      onChange={handleChange}
      error={Boolean(meta.touched && meta.error)}
      helperText={meta.touched && meta.error}
      slotProps={{ input: { inputMode: 'decimal' } }}
    />
  )
}

export default NumericField