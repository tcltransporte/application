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
  TextField
} from '@mui/material'
import { format, fromZonedTime } from 'date-fns-tz'
import { addStatement, getStatement, getStatements } from '@/app/server/settings/integrations/plugins/index.controller'
import { Successfully } from '../..'

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
  const [selectedStatement, setSelectedStatement] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rowLoading, setRowLoading] = useState(null)

  const [anchorEl, setAnchorEl] = useState(null) // dropdown
  const [openModal, setOpenModal] = useState(false) // modal "Novo"
  const today = new Date().toISOString().split('T')[0]
  const [dateValue, setDateValue] = useState(today) // campo de data

  useEffect(() => {
    fetch({ companyIntegrationId: data.companyIntegrationId })
  }, [])

  const fetch = async ({ companyIntegrationId }) => {
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

  const handleRowClick = async (item) => {
    setRowLoading(item.sourceId)
    try {
      const statementData = await getStatement({
        companyIntegrationId: data.companyIntegrationId,
        fileName: item.fileName
      })
      item.statementData = statementData
      setSelectedStatement(item)
      await onChange(item)
    } catch (err) {
      console.error('Erro ao selecionar extrato:', err)
    } finally {
      setRowLoading(null)
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
    await addStatement({companyIntegrationId: data.companyIntegrationId, date: dateValue})
    console.log('Data escolhida:', dateValue)
    setOpenModal(false)
    // Aqui você pode chamar sua função de criação de extrato e atualizar a lista
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography fontWeight="bold">Selecione um extrato</Typography>

        <ButtonGroup variant="outlined" size="small">
          <Button
            onClick={() => fetch({ companyIntegrationId: data.companyIntegrationId })}
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
        <Paper variant="outlined" sx={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Início</TableCell>
                <TableCell>Final</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statements.map((item) => {
                const isSelected = selectedStatement?.sourceId === item.sourceId
                const isLoadingRow = rowLoading === item.sourceId

                return (
                  <TableRow
                    key={item.sourceId}
                    hover
                    onClick={() => handleRowClick(item)}
                    sx={{
                      cursor: isLoadingRow ? 'wait' : 'pointer',
                      backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : undefined
                    }}
                  >
                    <TableCell width={30}>
                      {isLoadingRow ? (
                        <CircularProgress size={16} />
                      ) : (
                        isSelected && <i className="ri-check-line" style={{ fontSize: '16px' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {format(
                        fromZonedTime(item.begin, Intl.DateTimeFormat().resolvedOptions().timeZone),
                        'dd/MM/yyyy HH:mm'
                      )}
                    </TableCell>
                    <TableCell>
                      {format(
                        fromZonedTime(item.end, Intl.DateTimeFormat().resolvedOptions().timeZone),
                        'dd/MM/yyyy HH:mm'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Modal Novo */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs">
        <DialogTitle>Novo extrato</DialogTitle>
        <DialogContent>
          <div style={{padding: '15px'}}>
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
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirmNew}
            disabled={!dateValue}
            startIcon={<i className="ri-check-line" />}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}