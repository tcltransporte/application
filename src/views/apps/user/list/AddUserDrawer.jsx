'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { Formik, Form } from 'formik'
import * as Yup from 'yup'

// Components
import { AutoComplete } from '@/components/AutoComplete'
import { getUser } from '@/utils/search'

const AddUserDrawer = ({ userId, onClose, onSubmit }) => {

  const [shouldReset, setShouldReset] = useState(false)

  useEffect(() => {

    setShouldReset(true)

    if (userId) {
      alert(userId)
    }

  }, [userId])

  const handleSubmit = (values, { resetForm }) => {
    onClose(onSubmit())
  }

  return (
    <Drawer
      open={userId !== undefined}
      anchor='right'
      variant='temporary'
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Adicionar usuário</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <Formik
          initialValues={{ user: null }}
          validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, setFieldValue, setTouched, resetForm }) => {

            useEffect(() => {
              if (shouldReset) {
                resetForm()
                setShouldReset(false)
              }
            }, [shouldReset])

            return (
              <Form className='flex flex-col gap-5'>
                {/* AutoComplete controlado pelo Formik */}
                <AutoComplete
                  label='Usuário'
                  value={values.user}
                  text={(item) => item?.userName}
                  onChange={(val) => {
                    setFieldValue('user', val)
                    setTouched({ ...touched, user: true })
                  }}
                  onBlur={() => setTouched({ ...touched, user: true })}
                  onSearch={getUser}
                  error={touched.user && Boolean(errors.user)}
                  helperText={touched.user && errors.user}
                >
                  {(item) => <span>{item.userName}</span>}
                </AutoComplete>

                <div className='flex items-center gap-4'>
                  <Button variant='contained' type='submit' color='success'>
                    Confirmar
                  </Button>
                </div>
              </Form>
            )
          }}
        </Formik>
      </div>
    </Drawer>
  )
}

export default AddUserDrawer