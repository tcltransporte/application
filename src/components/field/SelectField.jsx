import React from 'react';
import MuiTextField from '@mui/material/TextField';

const SelectField = (props) => {
  const rawError =
    (props.form?.touched?.[props.field?.name] || props.form?.submitCount > 0)
      ? props.form?.errors?.[props.field?.name]
      : undefined;

  const errorMessage =
    rawError && rawError !== `${props.field?.name} is a required field`
      ? rawError
      : undefined;

  const showError = Boolean(rawError);

  const handleChange = (e) => {
    let val = e.target.value;
    props.form?.setFieldValue(props.field?.name, val);
    props.onChange?.(val);
  };

  return (
    <MuiTextField
      select
      fullWidth
      size="small"
      variant="filled"
      {...props.field}
      {...props}
      value={props.field?.value || ''}
      onChange={handleChange}
      onBlur={props.onBlur}
      error={showError}
      helperText={errorMessage}
      SelectProps={{
        native: false, // ou true se quiser <select> nativo
        MenuProps: {
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left', // garante alinhamento à esquerda
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left', // garante alinhamento à esquerda
          },
        },
      }}
      slotProps={{
        input: {
          readOnly: props.readOnly,
        },
        formHelperText: {
          sx: {
            display: errorMessage ? 'block' : 'none',
          },
        },
      }}
    >
      {props.children}
    </MuiTextField>
  );
};

export default SelectField;
