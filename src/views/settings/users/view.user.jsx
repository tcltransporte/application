'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { toast } from 'react-toastify'

import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'

import { Alert, FormControlLabel, Switch, TextField } from '@mui/material'
import * as users from '@/app/server/settings/users'
import _ from 'lodash'
import { BackdropLoading } from '@/components/BackdropLoading'
import { Drawer } from '@/components/Drawer'

export const ViewUser = ({ companyUserId, onClose }) => {
  const [errorState, setErrorState] = useState(null)
  const [companies, setCompanies] = useState(null)
  const [user, setUser] = useState(null)
  const [switchLoading, setSwitchLoading] = useState({})
  const [shouldReset, setShouldReset] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialCompanyIds, setInitialCompanyIds] = useState([])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setErrorState(null)
        setLoading(true)
        setShouldReset(true)

        if (companyUserId) {
          const companyUser = await users.getCompanyUser({ id: companyUserId })
          setCompanies(companyUser?.companies)
          const loadedUser = companyUser?.companyUser?.user || null
          setUser(loadedUser)

          const initialIds = loadedUser?.companyUsers?.map(cu => cu.companyId) || []
          setInitialCompanyIds(initialIds)
        } else {
          setUser(null)
          setInitialCompanyIds([])
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

      await setCompanyUser({ companyUserId, ...values })

      toast.success('Salvo com sucesso!', { closeButton: true, theme: 'colored' })

      onClose(true)

    } catch (error) {
      setErrorState(error.message || 'Erro ao salvar')
    } finally {
      setSubmitting(false)
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
        open={companyUserId !== undefined && !loading}
        title={`${companyUserId ? 'Editar' : 'Adicionar'} usuário`}
        variant='temporary'
        onClose={() => onClose()}
        width={'400px'}
      >

        <Formik
          enableReinitialize
          initialValues={{ userName: user?.userName || '' }}
          validationSchema={Yup.object({
            userName: Yup.string().required('Usuário é obrigatório')
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isSubmitting, resetForm }) => {

            useEffect(() => {
              if (shouldReset) {
                resetForm()
                setShouldReset(false)
              }
            }, [shouldReset, resetForm])

            return (
              <Form className='flex flex-col gap-5' style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                {companyUserId && _.map(companies, (c) => {
                  const match = user?.companyUsers.find(cu => cu.companyId === c.codigo_empresa_filial)

                  return (
                    <FormControlLabel
                      key={c.codigo_empresa_filial}
                      control={
                        <Switch
                          checked={!!match}
                          disabled={switchLoading[c.codigo_empresa_filial]}
                          onChange={async (event) => {
                            const checked = event.target.checked
                            const companyId = c.codigo_empresa_filial

                            setSwitchLoading(prev => ({ ...prev, [companyId]: true }))

                            try {
                              if (checked) {
                                const newCompanyUser = await createCompanyUser({
                                  companyId,
                                  userId: user.userId
                                })

                                setUser(prev => ({
                                  ...prev,
                                  companyUsers: [...(prev.companyUsers || []), newCompanyUser]
                                }))
                              } else {
                                const existingCU = user.companyUsers.find(cu => cu.companyId === companyId)
                                if (existingCU) {
                                  await deleteCompanyUser({ companyUserId: existingCU.id })
                                  setUser(prev => ({
                                    ...prev,
                                    companyUsers: prev.companyUsers.filter(cu => cu.companyId !== companyId)
                                  }))
                                }
                              }

                              toast.success('Atualizado com sucesso!')
                            } catch (err) {
                              console.error(err)
                              toast.error('Erro ao atualizar vínculo com a empresa')
                            } finally {
                              setSwitchLoading(prev => ({ ...prev, [companyId]: false }))
                            }
                          }}
                        />
                      }
                      label={c.surname}
                    />
                  )
                })}

                {companyUserId == null && (
                  <>
                    <Divider />
                    <div className='flex items-center gap-4'>
                      <Button type="submit" variant="contained" color='success' disabled={isSubmitting}>
                        {isSubmitting ? `Salvando...` : `Confirmar`}
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            )
          }}
        </Formik>
      </Drawer>
    </>
  )
}