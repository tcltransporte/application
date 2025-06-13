'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box, Button, Drawer, IconButton, Typography, Divider,
  RadioGroup, FormControlLabel, FormControl, FormLabel,
  Radio,
  CircularProgress
} from '@mui/material'
import { Formik, Form } from 'formik'
import * as yup from 'yup'
import { AutoComplete } from '@/components/AutoComplete'
import { getBankAccounts } from '@/utils/search'
import { PluginRenderer } from '@/views/settings/integrations/plugins'
import { onSubmitChanges } from '@/app/server/finances/statements/view.add-statement.controller'
//import { onSubmitChanges } from './view.add-statement.controller'

export const ViewAddStatement = ({ open, setOpen, onSubmit }) => {
  const [integrationId, setIntegrationId] = useState(null)
  const [isHovering, setIsHovering] = useState(false)
  const inputFileRef = useRef(null)
  const formikRef = useRef(null)

  useEffect(() => {
    if (open && formikRef.current) {
      formikRef.current.resetForm()
      setIntegrationId(null)
      setIsHovering(false)
    }
  }, [open])

  const handleSubmit = async (values, { resetForm }) => {
    try {
      await onSubmitChanges(values)
      onSubmit()
      setOpen(false)
    } catch (error) {
      console.log(error)
    }
  }

  const validationSchema = yup.object({
    uploadType: yup.string().required('Selecione o tipo de importação'),
    bankAccount: yup.object().nullable().required('Informe a conta bancária'),
  })

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      anchor="right"
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 450 },
          p: 6,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Novo Extrato</Typography>
        <IconButton size="small" onClick={() => setOpen(false)}>
          <i className="ri-close-line text-2xl" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Formik
        innerRef={formikRef}
        initialValues={{
          uploadType: '',
          bankAccount: null,
          droppedFile: null,
          statement: null,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, setFieldValue, handleSubmit, isSubmitting }) => (
          <Form
            onSubmit={handleSubmit}
            style={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              overflowY: 'auto',
              marginTop: 16,
            }}
          >
            <FormControl error={Boolean(touched.uploadType && errors.uploadType)}>
              <FormLabel>Tipo de importação</FormLabel>
              <RadioGroup
                row
                name="uploadType"
                value={values.uploadType}
                onChange={(e) => {
                  handleChange(e)
                  setFieldValue('droppedFile', null)
                  setFieldValue('statement', null)
                }}
              >
                <FormControlLabel value="integration" control={<Radio />} label="Integração Bancária" />
                <FormControlLabel value="ofx" control={<Radio />} label="Arquivo OFX" disabled />
              </RadioGroup>
              {touched.uploadType && errors.uploadType && (
                <Typography color="error" variant="caption">
                  {errors.uploadType}
                </Typography>
              )}
            </FormControl>

            <Box>
              <AutoComplete
                label="Conta bancária"
                value={values.bankAccount}
                text={(item) => `${item.bank?.name} - ${item.agency} / ${item.number}`}
                onSearch={getBankAccounts}
                onChange={(bankAccount) => {
                  setIntegrationId(bankAccount?.companyIntegration?.integrationId || null)
                  setFieldValue('statement', null)
                  setFieldValue('bankAccount', bankAccount)
                }}
              >
                {(item) => (
                  <div className="flex items-start space-x-2">
                    {item.bank?.icon && (
                      <img
                        src={item.bank.icon}
                        alt={item.bank.name}
                        className="w-[30px] h-[30px] mt-1"
                      />
                    )}
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{item.bank?.name}</span>
                      <span>Agência: {item.agency} / Conta: {item.number}</span>
                    </div>
                  </div>
                )}
              </AutoComplete>
              {touched.bankAccount && errors.bankAccount && (
                <Typography color="error" variant="caption">
                  {errors.bankAccount}
                </Typography>
              )}
            </Box>

            {values.uploadType === 'integration' && integrationId && (
              <PluginRenderer
                pluginId={integrationId}
                componentName="Statement"
                data={{ companyIntegrationId: values.bankAccount.companyIntegration.id }}
                onChange={(item) => {
                  setFieldValue('statement', item)
                }}
              />
            )}

            {values.uploadType === 'ofx' && (
              <>
                <input
                  type="file"
                  accept=".ofx"
                  ref={inputFileRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file?.name.endsWith('.ofx')) {
                      setFieldValue('droppedFile', file)
                    }
                  }}
                />

                <Box
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file?.name.endsWith('.ofx')) {
                      setFieldValue('droppedFile', file)
                    }
                    setIsHovering(false)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsHovering(true)
                  }}
                  onDragLeave={() => setIsHovering(false)}
                  onClick={() => inputFileRef.current?.click()}
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    padding: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isHovering ? '#f5f5f5' : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  {values.droppedFile ? (
                    <>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Arquivo pronto para envio!
                      </Typography>
                      <Typography><strong>Nome:</strong> {values.droppedFile.name}</Typography>
                      <Typography><strong>Tamanho:</strong> {(values.droppedFile.size / 1024).toFixed(2)} KB</Typography>
                      <Typography><strong>Tipo:</strong> {values.droppedFile.type || 'Desconhecido'}</Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setFieldValue('droppedFile', null)
                        }}
                      >
                        Remover arquivo
                      </Button>
                    </>
                  ) : isHovering ? (
                    <Typography>Arraste e solte um arquivo .OFX aqui</Typography>
                  ) : (
                    <Typography>Clique para selecionar um arquivo .OFX</Typography>
                  )}
                </Box>
              </>
            )}

            <Box sx={{ pt: 3, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  isSubmitting ||
                  !values.uploadType ||
                  !values.bankAccount ||
                  (values.uploadType === 'ofx' && !values.droppedFile) ||
                  (values.uploadType === 'integration' && !values.statement)
                }
                startIcon={isSubmitting && <CircularProgress size={16} color="inherit" />}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Drawer>
  )
}
