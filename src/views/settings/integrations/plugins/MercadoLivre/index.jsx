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
import { addStatement, getStatement, getStatements } from '@/app/server/settings/integrations/plugins/index.controller'

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

export const Statement = ({ data, onChange }) => {

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
      const statements = await getStatements({ companyIntegrationId })
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
      const statementData = await getStatement({
        companyIntegrationId: data.companyIntegrationId,
        fileName: item.fileName
      })
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
      await addStatement({ companyIntegrationId: data.companyIntegrationId, date: dateValue })
      setOpenModal(false)
      await fetchStatements({ companyIntegrationId: data.companyIntegrationId })
    } catch (err) {
      console.error('Erro ao criar extrato:', err)
    } finally {
      setConfirming(null)
    }
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography fontWeight="bold">Selecione um extrato</Typography>

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

      {loading ? (
        <Box mt={2} display="flex" justifyContent="center">
          <CircularProgress size={24} />
        </Box>
      ) : (
        // AQUI A MUDANÇA: Adicionado maxHeight para limitar a altura e ativar a rolagem
        <Box sx={{ overflowY: 'auto', p: 1, maxHeight: '400px' }}>
          <Grid container spacing={2}>
            {statements.map((item) => {
              const isConfirming = confirming === item.sourceId
              return (
                <Grid item key={item.sourceId} size={{xs: 12}}> {/* <-- Prop corrigida */}
                  
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
                    <CardContent sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleConfirmStatement(item)}
                          disabled={isConfirming}
                          startIcon={isConfirming ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                          {isConfirming ? 'Carregando...' : 'Confirmar'}
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
    </div>
  )
}