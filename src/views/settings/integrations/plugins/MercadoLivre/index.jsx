'use client'

import React, { useEffect, useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
  ButtonGroup,
  Box,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material'
import { format, fromZonedTime } from 'date-fns-tz'
import * as mercadolivre from '@/app/server/settings/integrations/plugins/mercado-livre.controller'

export const ID = '420E434C-CF7D-4834-B8A6-43F5D04E462A'

export const Connect = () => {

  const handleConnect = () => {
    window.location.href = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=4404783242240588&redirect_uri=https://vps53636.publiccloud.com.br:8081/settings/integration/mercado-livre`
  }

  return (
    <Box display="flex" justifyContent="flex-end" gap={2}>
      <Button variant="outlined">
        Cancelar
      </Button>
      <Button variant="contained" onClick={handleConnect}>
        Conectar
      </Button>
    </Box>
  )

}

const UploadArea = ({ onFiles }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFiles(files)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      onFiles(files)
    }
  }

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'grey.400',
        borderRadius: 2,
        p: 4,
        mb: 2,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <Typography fontWeight="bold">Arquivo CSV</Typography>
      <br></br>
      <Typography sx={{ mb: 2 }}>
        Selecione o arquivo ou arraste e solte aqui
      </Typography>

      {/* Botão separado para selecionar arquivo */}
      <Button
        variant="contained"
        color="primary"
        onClick={(e) => {
          e.stopPropagation()
          document.getElementById('file-input')?.click()
        }}
      >
        Selecionar arquivo
      </Button>

      {/* Input de arquivo escondido */}
      <input
        type="file"
        id="file-input"
        multiple
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </Box>
  )
}

export const Statement = ({ data, onChange }) => {

  const [uploadedFile, setUploadedFile] = useState(null)

  const [statements, setStatements] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(null) // Renamed for clarity

  const [anchorEl, setAnchorEl] = useState(null) // dropdown
  const [openModal, setOpenModal] = useState(false) // modal "Novo"
  const today = new Date().toISOString().split('T')[0]
  const [dateValue, setDateValue] = useState(today) // campo de data

  useEffect(() => {
    fetchStatements({ companyIntegrationId: data.companyIntegrationId })
  }, [])

  const fetchStatements = async ({ companyIntegrationId }) => {
    setLoading(true)
    try {
      const statements = await mercadolivre.getStatements({ companyIntegrationId })
      setStatements(statements)
    } catch (err) {
      console.error('Erro ao carregar extratos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmStatement = async (item) => {

    setConfirming(item.sourceId)

    try {

      const statementData = await mercadolivre.statement({
        companyIntegrationId: data.companyIntegrationId,
        item: item,
        file: uploadedFile
      })

      //console.log(releaseReport)

      //item.releaseReport = releaseReport

      item.statementData = statementData

      await onChange(item)

    } catch (err) {
      console.error('Erro ao confirmar extrato:', err)
    } finally {
      setConfirming(null)
    }
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNewOption = () => {
    setDateValue(new Date().toISOString().split('T')[0]) // sempre data atual
    setOpenModal(true)
    handleMenuClose()
  }

  const handleConfirmNew = async () => {
    setConfirming('new') // Using a unique key for the new statement
    try {
      await mercadolivre.addStatement({ companyIntegrationId: data.companyIntegrationId, date: dateValue })
      setOpenModal(false)
      await fetchStatements({ companyIntegrationId: data.companyIntegrationId })
    } catch (err) {
      console.error('Erro ao criar extrato:', err)
    } finally {
      setConfirming(null)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {!uploadedFile && (
        <UploadArea onFiles={(files) => setUploadedFile(files[0])} />
      )}

      {uploadedFile && (
        <>
          {/* Cabeçalho fixo */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
            sx={{ flexShrink: 0 }}
          >
            <Typography fontWeight="bold">Liberações</Typography>

            <ButtonGroup variant="outlined" size="small">
              <Button
                onClick={() => fetchStatements({ companyIntegrationId: data.companyIntegrationId })}
                disabled={loading}
                startIcon={
                  <i
                    className="ri-refresh-line"
                    style={{
                      fontSize: '18px',
                      animation: loading ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                }
              >
                {loading ? 'Atualizando...' : 'Atualizar'}
              </Button>
              <Button
                size="small"
                aria-controls={Boolean(anchorEl) ? 'split-menu' : undefined}
                aria-haspopup="true"
                onClick={handleMenuOpen}
              >
                <i className="ri-arrow-down-s-line" />
              </Button>
            </ButtonGroup>

            <Menu
              id="split-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleNewOption}>
                <i className="ri-add-line" style={{ marginRight: 8 }} /> Novo
              </MenuItem>
              <MenuItem onClick={() => console.log('Importar')} disabled>
                <i className="ri-upload-line" style={{ marginRight: 8 }} /> Importar
              </MenuItem>
            </Menu>
          </Box>

          {/* Lista com rolagem */}
          {loading ? (
            <Box mt={2} display="flex" justifyContent="center" sx={{ flexGrow: 1 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 1 }}>
              <Grid container spacing={2}>
                {statements.map((item) => {
                  const isConfirming = confirming === item.sourceId
                  return (
                    <Grid item key={item.sourceId} size={{xs: 12}}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover .confirm-button-box': {
                            opacity: 1,
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" component="span" sx={{ marginRight: 2 }}>
                              {format(
                                fromZonedTime(item.begin, Intl.DateTimeFormat().resolvedOptions().timeZone),
                                'dd/MM/yyyy'
                              )}
                            </Typography>
                            <Typography variant="body2" component="span" sx={{ marginRight: 2 }}>
                              até
                            </Typography>
                            <Typography variant="body2" component="span">
                              {format(
                                fromZonedTime(item.end, Intl.DateTimeFormat().resolvedOptions().timeZone),
                                'dd/MM/yyyy'
                              )}
                            </Typography>
                          </Box>
                          <Box
                            className="confirm-button-box"
                            sx={{
                              opacity: 0,
                              transition: 'opacity 0.3s',
                            }}
                          >
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleConfirmStatement(item)}
                              disabled={isConfirming}
                              startIcon={isConfirming ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                              {isConfirming ? 'Downloading...' : 'Download'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>
          )}
        </>
      )}
      
      {/* Modal Novo */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs">
        <DialogTitle>Novo extrato</DialogTitle>
        <DialogContent>
          <div style={{ padding: '15px' }}>
            <TextField
              label="Data"
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}
              sx={{ mt: 1 }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} disabled={confirming === 'new'}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmNew}
            disabled={!dateValue || confirming === 'new'}
            startIcon={
              confirming === 'new' ? <CircularProgress size={16} color="inherit" /> : <i className="ri-check-line" />
            }
          >
            {confirming === 'new' ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )

}