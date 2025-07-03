# Fields

## TextField
```jsx
import { Field } from 'formik'
import { TextField } from '@/components/field'

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
import { Field } from 'formik'
import { NumericField } from '@/components/field'

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
import { Field } from 'formik'
import { SelectField } from '@/components/field'

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


## Example
```jsx
import { Formik, Form } from 'formik'

<Formik>
    {({ touched, errors }) => {
        return (
            <Form>
                {/*<Field />*/}
            </Form>
        )
    }}
</Formik>
```