'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Backdrop from '@mui/material/Backdrop'
import { toast } from 'react-toastify'

// Third-party Imports
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'

// Components
import { Alert, TextField } from '@mui/material'
import { getCompanyUser, setCompanyUser } from '@/app/server/settings/users/view.user.controller'

export const ViewUser = ({ companyUserId, onClose, onSubmit }) => {

  const [errorState, setErrorState] = useState(null)
  const [users, setUsers] = useState(null)
  const [shouldReset, setShouldReset] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setErrorState(null)
        setLoading(true)
        setShouldReset(true)

        if (companyUserId) {
          const userData = await getCompanyUser({ id: companyUserId })
          setUsers(userData?.user || null)
        } else {
          setUsers(null)
        }
      } catch (error) {
        setErrorState(error.message || 'Erro ao carregar usuário')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [companyUserId])

  const handleSubmit = async (values, { setSubmitting }) => {
    try {

      setErrorState(null)
      setSubmitting(true)

      // Ajuste conforme sua API espera os dados
      await setCompanyUser({ companyUserId, ...values })

      toast.success('Salvo com sucesso!', { closeButton: true, theme: 'colored' })
      onClose()
      if (onSubmit) onSubmit()
    } catch (error) {
      setErrorState(error.message || 'Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Backdrop open={loading} sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff', flexDirection: 'column' }}>
        <CircularProgress color='inherit' />
        <Typography variant="h6" sx={{ mt: 2, color: '#fff' }}>
          Carregando...
        </Typography>
      </Backdrop>

      <Drawer
        open={companyUserId !== undefined && !loading}
        anchor='right'
        variant='temporary'
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-4' style={{padding: '16px'}}>
          <Typography variant='h5'>{companyUserId ? 'Editar' : 'Adicionar'} usuário</Typography>
          <IconButton size='small' onClick={onClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>

        <Divider />

        <div className='p-5' style={{padding: '16px'}}>
          <Formik
            enableReinitialize
            initialValues={{ userName: users?.userName || '' }}
            validationSchema={Yup.object({
              userName: Yup.string().required('Usuário é obrigatório')
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
                <Form className='flex flex-col gap-5' style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>

                  {errorState && (<Alert severity="warning">{errorState}</Alert>)}

                  <Field
                    as={TextField}
                    size='small'
                    name='userName'
                    label='Usuário'
                    variant='filled'
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    autoFocus
                    error={Boolean(touched.userName && errors.userName)}
                    helperText={touched.userName && errors.userName}
                    disabled={isSubmitting || companyUserId}
                  />

                  <Divider />

                  <div className='flex items-center gap-4'>
                    <Button type="submit" variant="contained" color='success' disabled={isSubmitting}>
                      {isSubmitting ? `Salvando...` : `Confirmar`}
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