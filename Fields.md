# Fields

## Imports
```jsx
import { Field } from 'formik'
import { TextField, NumericField, SelectField } from '@/components/field'
```

## TextField
```jsx
<Field
    as={TextField}
    label='Descrição'
    name='description'
    error={Boolean(touched.description && errors.description)}
    helperText={touched.description && errors.description}
/>
```

## NumericField
```jsx
<Field
    as={NumericField}
    label='Valor'
    name='value'
    error={Boolean(touched.value && errors.value)}
    helperText={touched.value && errors.value}
/>
```

## SelectField
```jsx
<Field
    as={SelectField}
    label="Tipo"
    name="type"
    error={Boolean(touched.type && errors.type)}
    helperText={touched.type && errors.type}
>
    <MenuItem value="">[Selecione]</MenuItem>
    <MenuItem value="1">Entrada</MenuItem>
    <MenuItem value="2">Saída</MenuItem>
</Field>
```