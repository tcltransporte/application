// components/SelectField.tsx
import {
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import React from 'react';

const SelectField = (props) => {

  const handleChange = (e) => {

    let val = e.target.value

    props.form?.setFieldValue(props.field?.name, val)

    props.onChange?.(val)

  }

  return (
    <FormControl
      fullWidth={props.fullWidth}
      variant={props.variant}
      size={props.size}
      error={props.error}
    >
      <InputLabel shrink>{props.label}</InputLabel>
      <Select
        variant='filled'
        size='small'
        name={props.name}
        {...props.field}
        {...props}
        value={props.field?.value || ''}
        onChange={handleChange}
        onBlur={props.onBlur}
        displayEmpty
        disabled={props.disabled}
      >
        {props.children}
      </Select>
      {props.error && <FormHelperText>{props.helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectField;