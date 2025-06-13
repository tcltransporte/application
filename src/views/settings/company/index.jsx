'use client'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'

import CardHeader from '@mui/material/CardHeader'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

import { onSubmit } from './index.controller'

export const Company = ({company}) => {

  const initialValues = {
    cnpj: company?.cnpj || '',
    name: company?.name || '',
    surname: company?.surname || '',
    checkbox: false
  }

  const validationSchema = {
    'company': Yup.object().shape({
      cnpj: Yup.string().required('Campo obrigatório'),
      name: Yup.string().required('Campo obrigatório'),
      surname: Yup.string().required('Campo obrigatório'),
    }),
    'desactivate': Yup.object().shape({
      checkbox: Yup.bool().oneOf([true], 'Por favor, confirme que você deseja excluir a empresa')
    }),
  }

  const handleSubmit = async (values) => {
    try {

      await onSubmit(values)

      await Swal.fire({ icon: 'success', text: 'Salvo com sucesso!' })

    } catch (error) {
      alert(error.message)
    }
  }

  const handleDesactivate = () => {
    
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='mbe-5'>
            <div className='flex max-sm:flex-col items-center gap-6'>
              <img height={75} width={75} className='rounded' src={'/images/avatars/1.png'} alt='Profile' />
              <div className='flex flex-grow flex-col gap-4'>
                <div className='flex flex-col sm:flex-row gap-4'>
                  <Button component='label' variant='text' htmlFor='account-settings-upload-image'>
                    Alterar logo
                    <input
                      hidden
                      type='file'
                      accept='image/png, image/jpeg'
                      id='account-settings-upload-image'
                    />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema['company']}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <fieldset disabled={isSubmitting}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Field name="cnpj">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="CNPJ"
                              variant="filled"
                              slotProps={{ inputLabel: { shrink: true }}}
                              error={!!errors.cnpj && touched.cnpj}
                              helperText={touched.cnpj && errors.cnpj}
                            />
                          )}
                        </Field>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4.5 }}>
                        <Field name="name">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Razão social"
                              variant="filled"
                              slotProps={{ inputLabel: { shrink: true }}}
                              error={!!errors.name && touched.name}
                              helperText={touched.name && errors.name}
                            />
                          )}
                        </Field>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4.5 }}>
                        <Field name="surname">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Nome fantasia"
                              variant="filled"
                              slotProps={{ inputLabel: { shrink: true }}}
                              error={!!errors.surname && touched.surname}
                              helperText={touched.surname && errors.surname}
                            />
                          )}
                        </Field>
                      </Grid>

                      <div className="divider"></div>

                      <Grid size={{ xs: 12 }}>
                        <Button
                          variant="contained"
                          type="submit"
                          disabled={isSubmitting}
                          startIcon={
                            <i
                              className={isSubmitting ? 'ri-loader-4-line spin' : 'ri-check-line'}
                            />
                          }
                        >
                          {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </Grid>
                      
                    </Grid>
                  </fieldset>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Excluir empresa' className='pbe-6' />
          <CardContent>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema['desactivate']}
              onSubmit={handleDesactivate}
            >
              {({ values, errors, touched, handleChange }) => (
                <Form>
                  <FormControl error={Boolean(errors.checkbox && touched.checkbox)} className='is-full mbe-6'>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name='checkbox'
                          checked={values.checkbox}
                          onChange={handleChange}
                        />
                      }
                      label='Confirmo a desativação da minha conta'
                    />
                    {errors.checkbox && touched.checkbox && (
                      <FormHelperText>{errors.checkbox}</FormHelperText>
                    )}
                  </FormControl>

                  <Button variant='contained' color='error' type='submit' disabled={!values.checkbox}>
                    Desativar empresa
                  </Button>

                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}