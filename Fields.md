## Fields

# TextField
```jsx
<Field
    as={TextField}
    label='Descrição'
    name='description'
    error={Boolean(touched.description && errors.description)}
    helperText={touched.description && errors.description}
    disabled={isSubmitting}
    autoFocus
/>
```

# SelectField
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