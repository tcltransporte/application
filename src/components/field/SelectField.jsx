import React from 'react';
import MuiTextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const SelectField = (props) => {
  const { field, form } = props;

  const rawError =
    (form?.touched?.[field?.name] || form?.submitCount > 0)
      ? form?.errors?.[field?.name]
      : undefined;

  const errorMessage =
    rawError && rawError !== `${field?.name} is a required field`
      ? rawError
      : undefined;

  const showError = Boolean(rawError);

  const handleChange = (e) => {
    let val = e.target.value;

    // sempre transformar "" em null pro Formik
    if (val === "") val = null;

    form?.setFieldValue(field?.name, val);
    props.onChange?.(val);
  };

  return (
    <MuiTextField
      select
      fullWidth
      size="small"
      variant="filled"
      {...field}
      {...props}
      value={field.value ?? ""}  // null vira "", para o MUI

      onChange={handleChange}
      onBlur={props.onBlur}
      error={showError}
      helperText={errorMessage}
      SelectProps={{
        native: false,
        displayEmpty: true, // 🔥 Permite exibir placeholder/value=""
        renderValue: (selected) => {
          if (selected === "" || selected === null) {
            return <span style={{ opacity: 0.6 }}>[Selecione]</span>; // 🔥 placeholder visual
          }
          return props.children.find(
            (child) => child.props.value === selected
          )?.props.children || selected;
        },
        MenuProps: {
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
          transformOrigin: { vertical: 'top', horizontal: 'left' },
        },
      }}
      slotProps={{
        input: { readOnly: props.readOnly },
        formHelperText: {
          sx: { display: errorMessage ? 'block' : 'none' },
        },
      }}
    >
      {/* opção placeholder real — precisa ser o primeiro */}
      <MenuItem value="">
        [Selecione]
      </MenuItem>

      {props.children}
    </MuiTextField>
  );
};

export default SelectField;
