import React from 'react';
import TextField from '@mui/material/TextField';

const CurrencyField = (props) => {
  const { field, form, decimalPlaces = 2, ...rest } = props;

  // Se não recebeu field ou form, renderiza TextField simples (ex: para uso fora do Formik)
  if (!field || !form) {
    return <TextField {...props} />;
  }

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

  const displayValue =
    value !== '' && value !== undefined && value !== null ? formatCurrency(value) : '';

  return (
    <TextField
      {...field}
      {...rest}
      value={displayValue}
      onChange={handleChange}
    />
  );
};

export default CurrencyField;