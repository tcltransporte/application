'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'

import { Alert, MenuItem } from '@mui/material'
import _ from 'lodash'
import * as categories from '@/app/server/settings/categories'
import { TextField, SelectField } from '@/components/field'
import { BackdropLoading } from '@/components/BackdropLoading'

export const ViewCategorie = ({ categorieId, onClose }) => {

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
          const categorie = await categories.findOne({ id: categorieId })
          console.log(categorie)
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

      await categories.submit({categorieId, ...values})

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

  console.log(user)

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
          <Typography variant='h5'>{categorieId ? 'Editar' : 'Adicionar'} Categoria</Typography>
          <IconButton size='small' onClick={handleClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>

        <Divider />

        <div className='p-5' style={{ padding: '16px' }}>
          <Formik
            enableReinitialize
            initialValues={{ description: user?.description || '', code: user?.code || '', account: user?.account || '', operation: user?.operation || '' }}
            validationSchema={Yup.object({
              description: Yup.string().required('Campo obrigatório!'),
              code: Yup.string().required('Campo obrigatório!'),
              operation: Yup.string().required('Campo obrigatório!')
            })}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, resetForm }) => {

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
                    component={TextField}
                    label='Descrição'
                    name='description'
                    disabled={isSubmitting}
                  />

                  <Field
                    component={SelectField}
                    label="Tipo"
                    name="operation"
                    disabled={isSubmitting}
                  >
                    <MenuItem value="">[Selecione]</MenuItem>
                    <MenuItem value="1">Receita</MenuItem>
                    <MenuItem value="2">Despesa</MenuItem>
                  </Field>

                  <Field
                    component={TextField}
                    label='Código'
                    name='code'
                    disabled={isSubmitting}
                  />

                  <Field
                    component={TextField}
                    label='Conta'
                    name='account'
                    disabled={isSubmitting}
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