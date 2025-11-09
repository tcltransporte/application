'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'

import CardHeader from '@mui/material/CardHeader'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import * as nfse from '@/app/server/settings/nfse'
import { SelectField, TextField } from '@/components/field'
import { Box, CircularProgress, MenuItem } from '@mui/material'
import { useEffect, useState } from 'react'

//import { onSubmit } from './index.controller'

export const NFSe = () => {

  const [company, setCompany] = useState()

  const [isLoading, setIsLoading] = useState(false)
  
  const fetchCompany = async () => {
    try {

      setIsLoading(true)

      const company = await nfse.findOne()

      setCompany(company)

    } catch (error) {
      console.log(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [])

  const initialValues = {
    dpsEnvironment: company?.dpsEnvironment || '',
    dpsLastNum: company?.dpsLastNum || '',
    dpsSerie: company?.dpsSerie || '',
    dpsRegimeCalculation: String(company?.dpsRegimeCalculation),
    dpsRegimeSpecial: String(company?.dpsRegimeSpecial),
    dpsOptingForSimpleNational: String(company?.dpsOptingForSimpleNational),
  }

  const validationSchema = {
    'company': Yup.object().shape({
      'cnpj': Yup.string().required('Campo obrigatório'),
      'name': Yup.string().required('Campo obrigatório'),
      'surname': Yup.string().required('Campo obrigatório'),
    }),
    'desactivate': Yup.object().shape({
      'checkbox': Yup.bool().oneOf([true], 'Por favor, confirme que você deseja excluir a empresa')
    }),
  }

  const handleSubmit = async (values) => {
    try {

      console.log(values)

      await nfse.submit(values)

      await Swal.fire({ icon: 'success', text: 'Salvo com sucesso!' })

    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          {/*
          <CardContent className='mbe-5'>
          </CardContent>
          */}
          <CardContent>

            {isLoading ? (<Box display="flex" justifyContent="center" my={4}><CircularProgress size={30} /></Box>) : (
              <>
                
                <Formik
                  initialValues={initialValues}
                  //validationSchema={validationSchema['company']}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form>
                      <fieldset disabled={isSubmitting}>
                        <Grid container spacing={2}>

                          <Grid size={{ xs: 12, sm: 2.5 }}>
                            <Field
                              component={SelectField}
                              label="Ambiente"
                              name="dpsEnvironment"
                            >
                              <MenuItem value="">[Selecione]</MenuItem>
                              <MenuItem value="1">1 - Produção</MenuItem>
                              <MenuItem value="2">2 - Homologação</MenuItem>
                            </Field>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 2 }}>

                            <Field
                              component={TextField}
                              type='text'
                              label='Última DPS'
                              name='dpsLastNum'
                            />
                          </Grid>

                          <Grid size={{ xs: 12, sm: 1.5 }}>
                            <Field
                              component={TextField}
                              type='text'
                              label='Série'
                              name='dpsSerie'
                            />
                          </Grid>

                        </Grid>

                        <Grid container spacing={2}>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Field
                              component={SelectField}
                              label="Regime Apuração"
                              name="dpsRegimeCalculation"
                            >
                              <MenuItem value="">[Selecione]</MenuItem>
                              <MenuItem value="1">1 - Regime de apuração dos tributos federais e municipal pelo Simples Nacional</MenuItem>
                              <MenuItem value="2">2 - Regime de apuração dos tributos federais pelo Simples Nacional e ISSQN por fora do Simples Nacional conforme legislação municipal</MenuItem>
                              <MenuItem value="3">3 - Regime de apuração dos tributos federais e municipal por fora do Simples Nacional conforme legislações federal e municipal</MenuItem>
                            </Field>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 2.6 }}>
                            <Field
                              component={SelectField}
                              label="Regime Especial"
                              name="dpsRegimeSpecial"
                            >
                              <MenuItem value="">[Selecione]</MenuItem>
                              <MenuItem value="0">0 - Nenhum</MenuItem>
                              <MenuItem value="1">1 - Ato Cooperado (Cooperativa)</MenuItem>
                              <MenuItem value="2">2 - Estimativa</MenuItem>
                              <MenuItem value="3">3 - Microempresa Municipal</MenuItem>
                              <MenuItem value="4">4 - Notário ou Registrador</MenuItem>
                              <MenuItem value="5">5 - Profissional Autônomo</MenuItem>
                              <MenuItem value="6">6 - Sociedade de Profissionais</MenuItem>
                            </Field>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 3.4 }}>
                            <Field
                              component={SelectField}
                              label="Optante Simples Nacional"
                              name="dpsOptingForSimpleNational"
                            >
                              <MenuItem value="">[Selecione]</MenuItem>
                              <MenuItem value="1">1 - Não optante pelo Simples Nacional</MenuItem>
                              <MenuItem value="2">2 - Optante pelo Simples Nacional - MEI</MenuItem>
                              <MenuItem value="3">3 - Optante pelo Simples Nacional - ME/EPP</MenuItem>
                            </Field>
                          </Grid>

                        </Grid>

                        <div className="divider" style={{paddingBottom: '16px'}}></div>

                        <Grid container spacing={2}>
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
              </>
            )}

          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}