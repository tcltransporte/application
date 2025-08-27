import React from 'react'
import MuiTextField from '@mui/material/TextField'

const NumericField = (props) => {

  const decimalPlaces = props.decimalPlaces || 2

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

    if (props.form?.setFieldValue) {
      props.form?.setFieldValue(props.field?.name, decimalValue)
    }

    if (props.onChange) {
      props.onChange(decimalValue)
    }

  }

  return (
    <MuiTextField
      {...props}
      value={formatValue(props.field.value)}
      onChange={handleChange}
      slotProps={{ input: { inputMode: 'decimal' } }}
    />
  )
}

export default NumericField