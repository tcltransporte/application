'use client'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'

import Button from '@mui/material/Button'
import * as nfse from '@/app/server/settings/nfse'
import { AutoComplete, NumericField, SelectField, TextField } from '@/components/field'
import { Box, CircularProgress, Divider, IconButton, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { useEffect, useState } from 'react'

import * as search from '@/utils/search';
import { Drawer } from '@/components/Drawer'

// ➤ Opções ISSQN
export const ISSQN_OPTIONS = [
  { value: "1", label: "1 - Operação tributável" },
  { value: "2", label: "2 - Exportação de serviço" },
  { value: "3", label: "3 - Não Incidência" },
  { value: "4", label: "4 - Imunidade" }
]

// ➤ Opções Retenção
export const RETENTION_OPTIONS = [
  { value: "1", label: "1 - Não Retido" },
  { value: "2", label: "2 - Retido pelo Tomador" },
  { value: "3", label: "3 - Retido pelo Intermediário" }
]

const getLabel = (options, value) => {
  const item = options.find(i => String(i.value) === String(value))
  return item ? item.label : ""
}

export const TributacaoDrawer = ({ editingItem, onSubmit, onClose }) => {

  const initialValues = editingItem === null 
      ? { codigo: '', descricao: '', aliquota: '' }
      : editingItem || {}

  const validationSchema = Yup.object().shape({
    description: Yup.string().required('Campo obrigatório'),
    aliquota: Yup.number().required('Campo obrigatório')
  })

  return (
    <Drawer open={editingItem !== undefined} title={editingItem ? 'Editar tributação' : 'Adicionar tributação'} width={'700px'} onClose={onClose}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          await onSubmit(values)
          onClose()
        }}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form>

            <Grid container spacing={2}>

              <Grid item size={{sm: 12, md: 12}}>
                <Field
                  component={TextField}
                  name="description"
                  label="Descrição"
                />
              </Grid>

              <Grid item size={{sm: 12, md: 12}}>
                <Field
                  component={AutoComplete}
                  name="operation"
                  label="Operação"
                  text={(operation) => `${operation?.code} - ${operation?.description}`}
                  onSearch={(value) => search.nfseOperation(value)}
                  renderSuggestion={(item) => <span>{item.code} - {item.description}</span>}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4.6 }}>
                <Field component={SelectField} label="ISSQN" name="issqnId">
                  <MenuItem value="">[Selecione]</MenuItem>
                  {ISSQN_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Field>
              </Grid>

              <Grid size={{ xs: 12, sm: 4.6 }}>
                <Field component={SelectField} label="Retenção" name="retentionId">
                  <MenuItem value="">[Selecione]</MenuItem>
                  {RETENTION_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Field>
              </Grid>

              <Grid item size={{ sm: 12, md: 2.8 }}>
                <Field name="aliquota" label="Aliquota (%)" component={NumericField} />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </Grid>

            </Grid>

          </Form>
        )}
      </Formik>
    </Drawer>
  )
}

export const TributacaoTable = ({ items, onAdd, onEdit }) => {
  return (
    <Box>

      <Table size="small">

        <TableHead>
          <TableRow>
            <TableCell>Descrição</TableCell>
            <TableCell width={400}>Operação</TableCell>
            <TableCell width={200}>ISSQN</TableCell>
            <TableCell width={220}>Retenção</TableCell>
            <TableCell align='right' width={80}>Alíq (%)</TableCell>
            <TableCell width={60}></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {items?.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.operation?.code} - {row.operation?.description}</TableCell>
              <TableCell>{getLabel(ISSQN_OPTIONS, row.issqnId)}</TableCell>
              <TableCell>{getLabel(RETENTION_OPTIONS, row.retentionId)}</TableCell>
              <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.aliquota)}</TableCell>
              <TableCell>
                <IconButton onClick={() => onEdit(row)}>
                  <i className="ri-edit-line" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>

      <Button
        variant="text"
        startIcon={<i className="ri-add-circle-line" />}
        sx={{ mt: 2 }}
        onClick={onAdd}
      >
        Adicionar tributação
      </Button>

    </Box>
  )
}

export const NFSe = () => {

  const [company, setCompany] = useState()

  const [isLoading, setIsLoading] = useState(false)

   // ➤ Tributações
  const [tributacoes, setTributacoes] = useState([])

  // ➤ Drawer
  const [editingItem, setEditingItem] = useState(undefined)

  const handleAddTributacao = () => {
    setEditingItem(null)
  }

  const handleEditTributacao = (item) => {
    setEditingItem(item) 
  }

  const handleCloseDrawer = () => {
    setEditingItem(undefined)
  }

  const handleSaveTributacao = (values) => {
    if (editingItem) {
      setTributacoes(prev =>
        prev.map(t => t.id === editingItem.id ? { ...editingItem, ...values } : t)
      )
    } else {
      setTributacoes(prev => [...prev, { id: '', ...values }])
    }
  }
  
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
    dpsEnvironment: company?.dpsEnvironment ?? '',
    dpsLastNum: company?.dpsLastNum ?? '',
    dpsSerie: company?.dpsSerie ?? '',
    dpsRegimeCalculation: String(company?.dpsRegimeCalculation),
    dpsRegimeSpecial: String(company?.dpsRegimeSpecial),
    dpsOptingForSimpleNational: company?.dpsOptingForSimpleNational ?? '',
  }

  const handleSubmit = async (values) => {
    try {

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
                              <MenuItem value="1">1 - Não optante pelo Simples Nacional</MenuItem>
                              <MenuItem value="2">2 - Optante pelo Simples Nacional - MEI</MenuItem>
                              <MenuItem value="3">3 - Optante pelo Simples Nacional - ME/EPP</MenuItem>
                            </Field>
                          </Grid>

                        </Grid>

                        <div className="divider" style={{paddingBottom: '16px'}}></div>

                        <TributacaoTable
                          items={tributacoes}
                          onAdd={handleAddTributacao}
                          onEdit={handleEditTributacao}
                        />

                        <TributacaoDrawer
                          editingItem={editingItem}
                          onSubmit={handleSaveTributacao}
                          onClose={handleCloseDrawer}
                        />
                        
                        
                        <br></br>
                        <Divider />
                        
                        <br></br>
                        <br></br>

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