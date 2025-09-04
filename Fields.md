# Fields

## TextField
```jsx
import { Field } from 'formik'
import { TextField } from '@/components/field'

<Field
    component={TextField}
    type='text'
    label='Descrição'
    name='description'
/>
```

## NumericField
```jsx
import { Field } from 'formik'
import { NumericField } from '@/components/field'

<Field
    component={NumericField}
    type="number"
    label='Valor'
    name='value'
/>
```

## SelectField
```jsx
import { Field } from 'formik'
import { SelectField } from '@/components/field'

<Field
    component={SelectField}
    label="Tipo"
    name="type"
>
    <MenuItem value="">[Selecione]</MenuItem>
    <MenuItem value="1">Entrada</MenuItem>
    <MenuItem value="2">Saída</MenuItem>
</Field>
```

## AutoComplete
```jsx
import { Field } from 'formik'
import { AutoComplete } from '@/components/field'

<Field
    component={AutoComplete}
    label="Banco"
    name="bank"
    text={(bank) => bank?.name || ''}
    onSearch={getBanks}
    renderSuggestion={(item) => (
        <span>{item.id} - {item.name}</span>
    )}
/>
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