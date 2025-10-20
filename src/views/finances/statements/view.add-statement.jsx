'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Box, Drawer, IconButton, Typography, Divider,
  RadioGroup, FormControlLabel, FormControl, FormLabel,
  Radio
} from '@mui/material'
import { AutoComplete } from '@/components/field/AutoComplete'
import { getBankAccounts } from '@/utils/search'
import { PluginRenderer } from '@/views/settings/integrations/plugins'
import * as statements from '@/app/server/finances/statements'
import _ from 'lodash'

export const ViewAddStatement = ({ open, onClose, onSubmit }) => {
  const [uploadType, setUploadType] = useState('')
  const [bankAccount, setBankAccount] = useState(null)
  const [droppedFile, setDroppedFile] = useState(null)
  const [statement, setStatement] = useState(null)
  const [integrationId, setIntegrationId] = useState(null)
  const [isHovering, setIsHovering] = useState(false)
  const inputFileRef = useRef(null)

  useEffect(() => {
    if (open) {
      setUploadType('')
      setBankAccount(null)
      setDroppedFile(null)
      setStatement(null)
      setIntegrationId(null)
      setIsHovering(false)
    }
  }, [open])

  const handleSubmit = async (statement) => {
    try {

      console.log(statement)

      await statements.create({statement: {...statement}, bankAccount})
      await onSubmit()
      
    } catch (error) {
      console.log(error)
    }
  }

  console.log(bankAccount)

  return (
    <Drawer
      open={open}
      onClose={() => onClose()}
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
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Novo Extrato</Typography>
        <IconButton size="small" onClick={() => onClose(false)}>
          <i className="ri-close-line text-2xl" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Conteúdo */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
        {/* Tipo de importação */}
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Tipo de importação</FormLabel>
          <RadioGroup
            row
            value={uploadType}
            onChange={(e) => {
              setUploadType(e.target.value)
              setDroppedFile(null)
              setStatement(null)
            }}
          >
            <FormControlLabel value="integration" control={<Radio />} label="Integração Bancária" />
            <FormControlLabel value="ofx" control={<Radio />} label="Arquivo OFX" disabled />
          </RadioGroup>
        </FormControl>

        {/* Conta bancária */}
        <AutoComplete
          name="bankAccount"
          label="Conta bancária"
          value={bankAccount}
          text={(bankAccount) => `${bankAccount.name} - ${bankAccount.agency} / ${bankAccount.number}`}
          onSearch={getBankAccounts}
          renderSuggestion={(bankAccount) => (
            <div className="flex items-start space-x-2">
              {bankAccount.bank?.icon && (
                <img
                  src={bankAccount.bank.icon}
                  alt={bankAccount.name}
                  className="w-[30px] h-[30px] mt-1"
                />
              )}
              <div className="flex flex-col text-sm">
                <span className="font-medium">{bankAccount.name}</span>
                <span>Agência: {bankAccount.agency} / Conta: {bankAccount.number}</span>
              </div>
            </div>
          )}
          onChange={(value) => {
            const companyIntegration = _.filter(value?.bankAccountIntegrations, (item) =>
              item.typeBankAccountIntegrationId === "A4518539-3E1A-4595-B61D-8FA095B1A1A8"
            )[0]
            setIntegrationId(companyIntegration?.companyIntegration?.integrationId)
            setStatement(null)
            setBankAccount(value)
          }}
        />

        {/* Integração bancária */}
        {uploadType === 'integration' && integrationId && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <PluginRenderer
              pluginId={integrationId}
              componentName="Statement"
              data={{
                companyIntegrationId: _.filter(
                  bankAccount?.bankAccountIntegrations,
                  (item) => item.typeBankAccountIntegrationId === "A4518539-3E1A-4595-B61D-8FA095B1A1A8"
                )[0]?.companyIntegration?.id,
              }}
              onChange={async (item) => {
                setStatement(item)
                await handleSubmit(item)
              }}
              style={{ flex: 1, display: 'flex' }}
            />
          </Box>
        )}

        {/* Upload OFX */}
        {uploadType === 'ofx' && (
          <>
            <input
              type="file"
              accept=".ofx"
              ref={inputFileRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file?.name.endsWith('.ofx')) {
                  setDroppedFile(file)
                  handleSubmit()
                }
              }}
            />

            <Box
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file?.name.endsWith('.ofx')) {
                  setDroppedFile(file)
                  handleSubmit()
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
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isHovering ? '#f5f5f5' : 'transparent',
                transition: 'background-color 0.2s ease',
              }}
            >
              {droppedFile ? (
                <>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Arquivo pronto para envio!
                  </Typography>
                  <Typography><strong>Nome:</strong> {droppedFile.name}</Typography>
                  <Typography><strong>Tamanho:</strong> {(droppedFile.size / 1024).toFixed(2)} KB</Typography>
                </>
              ) : isHovering ? (
                <Typography>Arraste e solte um arquivo .OFX aqui</Typography>
              ) : (
                <Typography>Clique para selecionar um arquivo .OFX</Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}
