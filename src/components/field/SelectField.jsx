// components/SelectField.tsx
import {
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import React from 'react';

const SelectField = ({
  label,
  children,
  error,
  helperText,
  fullWidth = true,
  variant = 'filled',
  size = 'small',
  disabled = false,
  ...fieldProps
}) => {
  const { name, value, onChange, onBlur } = fieldProps;

  return (
    <FormControl
      fullWidth={fullWidth}
      variant={variant}
      size={size}
      error={error}
    >
      <InputLabel shrink>{label}</InputLabel>
      <Select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        displayEmpty
        disabled={disabled}
      >
        {children}
      </Select>
      {error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectField;