'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { Field, Form, Formik, useFormikContext } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'

import Button from '@mui/material/Button'
import { onSubmit } from '@/app/server/settings/company/index.controller'
import { AutoComplete, TextField } from '@/components/field'

import * as search from '@/utils/search'
import { IconButton, InputAdornment } from '@mui/material'

async function buscarEnderecoPeloCep(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  return await response.json()
}

const CepField = () => {
  const { values, setFieldValue } = useFormikContext()

  const handleSearch = async () => {
    const cep = values.zipCode?.replace(/\D/g, '')

    if (!cep || cep.length !== 8) return

    const data = await buscarEnderecoPeloCep(cep)

    if (!data?.erro) {
      setFieldValue('street', data.logradouro || '')
      setFieldValue('district', data.bairro || '')
      setFieldValue('city', data.localidade || '')
      setFieldValue('state', data.uf || '')
    }
  }

  return (
    <Field
      component={TextField}
      label="CEP"
      name="zipCode"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onMouseDown={handleSearch}>
                <i className="ri-map-pin-2-line" style={{ fontSize: 20 }} />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  )
}

export const Company = ({ company }) => {

  const initialValues = {
    logo: company?.logo || null,
    cnpj: company?.cnpj || '',
    name: company?.name || '',
    surname: company?.surname || '',
    zipCode: company?.zipCode || '',
    street: company?.street || '',
    number: company?.number || '',
    complement: company?.complement || '',
    district: company?.district || '',
    city: company?.city || null,
    state: company?.city?.state || null,
  }

  const validationSchema = Yup.object().shape({
    cnpj: Yup.string().required('Campo obrigatório'),
    name: Yup.string().required('Campo obrigatório'),
    surname: Yup.string().required('Campo obrigatório')
  })

  const handleSubmit = async (values) => {
    try {
      await onSubmit(values)
      await Swal.fire({ icon: 'success', text: 'Salvo com sucesso!' })
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid xs={12}>
        <Card>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form>

                <CardContent className='mbe-5'>
                  <div className='flex max-sm:flex-col items-center gap-6'>

                    <img height={60} src={values.logo ? `data:image/png;base64,${values.logo}` : '/images/no-logo.png'} alt='Logo' />

                    <Button component='label' variant='text'>
                      Alterar logo
                      <input
                        hidden
                        type='file'
                        accept='image/png, image/jpeg'
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return

                          const reader = new FileReader()
                          reader.onloadend = () => {
                            const base64 = reader.result.split(',')[1]
                            setFieldValue('logo', base64)
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                    </Button>
                  </div>
                </CardContent>

                <CardContent>

                  <fieldset disabled={isSubmitting} style={{ paddingBottom: '14px' }}>
                    <legend>Dados gerais</legend>

                    <Grid container spacing={2}>
                      <Grid xs={12} sm={3}>
                        <Field component={TextField} label="CNPJ" name="cnpj" />
                      </Grid>

                      <Grid xs={12} sm={4.5}>
                        <Field component={TextField} label="Razão social" name="name" />
                      </Grid>

                      <Grid xs={12} sm={4.5}>
                        <Field component={TextField} label="Nome fantasia" name="surname" />
                      </Grid>
                    </Grid>
                  </fieldset>

                  <fieldset disabled={isSubmitting} style={{ paddingBottom: '14px' }}>
                    <legend>Endereço</legend>

                    <Grid container spacing={2}>
                      <Grid xs={12} sm={1.5}>
                        <CepField />
                      </Grid>

                      <Grid xs={12} sm={5.5}>
                        <Field component={TextField} label="Logradouro" name="street" />
                      </Grid>

                      <Grid xs={12} sm={2}>
                        <Field component={TextField} label="Número" name="number" />
                      </Grid>

                      <Grid xs={12} sm={3}>
                        <Field component={TextField} label="Complemento" name="complement" />
                      </Grid>

                      <Grid xs={12} sm={5}>
                        <Field component={TextField} label="Bairro" name="district" />
                      </Grid>

                      <Grid xs={12} sm={2}>
                        <Field
                          component={AutoComplete}
                          name="state"
                          label="Estado"
                          text={(state) => state?.name}
                          onSearch={(value) => search.state(value)}
                          renderSuggestion={(item) => <span>{item.name}</span>}
                        />
                      </Grid>

                      <Grid xs={12} sm={5}>
                        <Field
                          component={AutoComplete}
                          name="city"
                          label="Cidade"
                          text={(city) => `${city.name} - ${city.state?.acronym}`}
                          onSearch={(value) => search.city(value, values.state?.codigo_uf)}
                          renderSuggestion={(item) => <span>{item.name} - {item.state?.acronym}</span>}
                        />
                      </Grid>
                    </Grid>
                  </fieldset>

                  <Grid xs={12}>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={isSubmitting}
                      startIcon={<i className={isSubmitting ? 'ri-loader-4-line spin' : 'ri-check-line'} />}
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </Grid>
                </CardContent>

              </Form>
            )}
          </Formik>

        </Card>
      </Grid>
    </Grid>
  )
}
