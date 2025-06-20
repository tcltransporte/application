import React from 'react';
import TextField from '@mui/material/TextField';

const CurrencyField = ({
  field, // { name, value, onChange, onBlur } do Formik
  form,  // { setFieldValue, ... }
  decimalPlaces = 2,
  ...props
}) => {
  const { name, value } = field;
  const { setFieldValue } = form;

  // Formata número para BR (exemplo)
  const formatCurrency = (num) => {
    if (num === undefined || num === null || num === '') return '';
    return Number(num)
      .toFixed(decimalPlaces)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleChange = (e) => {
    let val = e.target.value;

    // Remove tudo que não for número
    val = val.replace(/\D/g, '');

    if (val === '') {
      setFieldValue(name, '');
      return;
    }

    let numberValue = parseInt(val, 10);
    numberValue = numberValue / Math.pow(10, decimalPlaces);

    setFieldValue(name, numberValue);
  };

  // Valor exibido já formatado
  const displayValue = value !== '' && value !== undefined && value !== null
    ? formatCurrency(value)
    : '';

  return (
    <TextField
      {...field}
      {...props}
      value={displayValue}
      onChange={handleChange}
    />
  );
};

export default CurrencyField;