'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Backdrop from '@mui/material/Backdrop'
import { toast } from 'react-toastify'

import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'

import { Alert, FormControlLabel, MenuItem, Select, Switch } from '@mui/material'
import { createCompanyUser, deleteCompanyUser, getCompanyUser, setCompanyUser } from '@/app/server/settings/users/view.user.controller'
import _ from 'lodash'
import { getCategorie, saveCategorie } from '@/app/server/settings/categories/view.categorie.controller'
import { TextField, SelectField, NumericField, AutoComplete } from '@/components/field'
import * as bankAccount from '@/app/server/settings/bank-accounts'
import { getBanks } from '@/utils/search'
import { BackdropLoading } from '@/components/BackdropLoading'

export const ViewBankAccount = ({ categorieId, onClose }) => {

  const [errorState, setErrorState] = useState(null)
  const [user, setUser] = useState(null)
  const [shouldReset, setShouldReset] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialCompanyIds, setInitialCompanyIds] = useState([])

  useEffect(() => {
    const fetchUser = async () => {
      try {

        setErrorState(null)
        setLoading(true)
        setShouldReset(true)

        if (categorieId) {
          const categorie = await bankAccount.findOne({ codigo_conta_bancaria: categorieId })
          setUser(categorie)
        } else {
          setUser(null)
        }

      } catch (error) {
        setErrorState(error.message || 'Erro ao carregar usuário')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [categorieId])

  const handleSubmit = async (values, { setSubmitting }) => {
    try {

      await bankAccount.upsert({categorieId, ...values})

      setErrorState(null)

      onClose(true)
      
      /*
      setSubmitting(true)

      await setCompanyUser({ categorieId, ...values })

      toast.success('Salvo com sucesso!', { closeButton: true, theme: 'colored' })

      onClose(true)
      */

    } catch (error) {
      setErrorState(error.message || 'Erro ao salvar')
    } finally {
      //setSubmitting(false)
    }
  }

  const handleClose = () => {

    const currentIds = user?.companyUsers?.map(cu => cu.companyId) || []
    const initialSorted = [...initialCompanyIds].sort()
    const currentSorted = [...currentIds].sort()

    const hasChanged =
      initialSorted.length !== currentSorted.length ||
      !initialSorted.every((val, idx) => val === currentSorted[idx])

    onClose(hasChanged)
    
  }

  return (
    <>

      <BackdropLoading loading={loading} message={`Carregando...`} />

      <Drawer
        open={categorieId !== undefined && !loading}
        anchor='right'
        variant='temporary'
        //ModalProps={{ keepMounted: true }}
        onClose={() => onClose()}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-4' style={{ padding: '16px' }}>
          <Typography variant='h5'>{categorieId ? 'Editar' : 'Adicionar'} conta bancária</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>

        <Divider />

        <div className='p-5' style={{ padding: '16px' }}>
          <Formik
            enableReinitialize
            initialValues={{
              codigo_conta_bancaria: user?.codigo_conta_bancaria,
              bank: user?.bank,
              holder: user?.holder || '',
              agency: user?.agency || '',
              number: user?.number || ''
            }}
            validationSchema={Yup.object({
              //description: Yup.string().required('Campo obrigatório!'),
            })}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, errors, touched, isSubmitting, resetForm }) => {

              useEffect(() => {
                if (shouldReset) {
                  resetForm()
                  setShouldReset(false)
                }
              }, [shouldReset, resetForm])

              return (
                <Form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {errorState && (<Alert severity="warning">{errorState}</Alert>)}

                  <Field
                    as={AutoComplete}
                    name="bank"
                    label="Banco"
                    text={(bank) => bank?.name || ''}
                    onSearch={getBanks}
                    renderSuggestion={(item) => (
                      <span>{item.id} - {item.name}</span>
                    )}
                  />

                  <Field
                    as={TextField}
                    label='Titular'
                    name='holder'
                    error={Boolean(touched.holder && errors.holder)}
                    helperText={touched.holder && errors.holder}
                    disabled={isSubmitting}
                    autoFocus
                  />

                  <Field
                    as={TextField}
                    label='Agência'
                    name='agency'
                    error={Boolean(touched.agency && errors.agency)}
                    helperText={touched.agency && errors.agency}
                    disabled={isSubmitting}
                    autoFocus
                  />

                  <Field
                    as={TextField}
                    label='Conta'
                    name='number'
                    error={Boolean(touched.number && errors.number)}
                    helperText={touched.number && errors.number}
                    disabled={isSubmitting}
                    autoFocus
                  />

                  <Divider />

                  <div className='flex items-center gap-4'>
                    <Button type="submit" variant="contained" color='success' disabled={isSubmitting}>
                      {isSubmitting ? `Salvando...` : `Salvar`}
                    </Button>
                  </div>

                </Form>
              )
            }}
          </Formik>
        </div>
      </Drawer>
    </>
  )
}