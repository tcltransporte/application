'use client'

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  TablePagination,
  IconButton,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { updateInstallment } from '@/app/server/finances/prepare/index.controller' // ajuste seu import real aqui
import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { PeriodFilter } from '@/components/PeriodFilter'
import { getPayments } from '@/app/server/finances/payments/index.controller'

export const ViewFinancesPayments = ({ initialPayments = [] }) => {

  const theme = useTheme()

  const { setTitle } = useTitle()

  const [installments, setInstallments] = useState(initialPayments)
  
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {

    setTitle(['Finanças', 'Contas a pagar'])

  }, [])

  const fetchPayments = async ({ limit, offset, dueDate }) => {
    try {
      setIsFetching(true)
      const response = await getPayments({ limit, offset, dueDate })
      setInstallments(response)
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetching(false)
    }
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState(null)

  const handleCloseEditModal = () => {
    setModalOpen(false)
    setSelectedInstallment(null)
  }
  const handleSaveEditedAmount = async (installmentId, newAmount) => {
    addLoadingInstallment(installmentId)
    try {
      await updateInstallment({ id: installmentId, amount: newAmount })
      setInstallments((prev) =>
        prev.map((inst) => (inst.id === installmentId ? { ...inst, amount: newAmount } : inst))
      )
      handleCloseEditModal()
    } catch (error) {
      alert(`Erro ao atualizar valor: ${error.message}`)
    } finally {
      removeLoadingInstallment(installmentId)
    }
  }

  // Modal componente interno
  const EditInstallment = ({ open, onClose, installment, onSave }) => {
    const [amount, setAmount] = useState(installment.amount || 0)

    useEffect(() => {
      setAmount(installment.amount || 0)
    }, [installment])

    const handleSave = () => {
      if (amount < 0 || isNaN(amount)) {
        alert('Valor inválido')
        return
      }
      onSave(installment.id, amount)
    }

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle
          sx={{
            fontWeight: '700',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            py: 1.5,
            userSelect: 'none',
          }}
        >
          Editar Valor da Parcela #{installment.id}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Valor"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            inputProps={{ min: 0, step: 0.01 }}
            autoFocus
            margin="normal"
            sx={{
              '& input': {
                fontWeight: 600,
                fontSize: '1.1rem',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  const totalCount = 0

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Cabeçalho fixo */}
      <Box sx={{ p: 2, position: 'sticky', top: 0, zIndex: 1100, backgroundColor: theme.palette.background.default, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 'var(--header-height)' }}>
        
        <Button variant="contained" startIcon={<i className="ri-add-circle-line" />}
          //onClick={() => setInstallmentId(null)}
        >
          Adicionar
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          
          <PeriodFilter
            title="Vencimento"
            initialDateRange={[
              new Date(installments.request?.dueDate?.start),
              new Date(installments.request?.dueDate?.end)
            ]}
            //onChange={handlePeriodChange}
          />

          <Button
            variant="text"
            startIcon={<i className="ri-equalizer-line" />}
            onClick={() => setOpenDrawer(true)}
          >
            Filtros
          </Button>

          <Button
            variant="outlined"
            startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
            onClick={() => fetchPayments({ limit: installments.request.limit, offset: 0 })}
            disabled={isFetching}
          >
            {isFetching ? 'Pesquisando...' : 'Pesquisar'}
          </Button>
          
        </Box>
      </Box>

      {/* Conteúdo da tabela */}
      <Box sx={{ flex: 1, mt: 1, overflow: 'auto' }}>
        {true ? (
          <Paper
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
            }}
            elevation={4}
          >
            <Box sx={{ flex: 1 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Número documento</TableCell>
                    <TableCell>Beneficiário</TableCell>
                    <TableCell>Forma de pagamento</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Agendamento</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Agência/Conta</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isFetching ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ height: 'calc(100vh - 200px)' }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    installments.response?.rows?.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{payment.numero_documento}</TableCell>
                        <TableCell>{payment.financialMovement?.partner?.surname}</TableCell>
                        <TableCell>{payment.paymentMethod?.name}</TableCell>
                        <TableCell>{DateFormat(new Date(payment.dueDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{DateFormat(new Date(), "dd/MM/yyyy")}</TableCell>
                        <TableCell align="right">
                          {/* Formatar valor aqui */}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{payment.bankAccount?.bank?.name}</Typography>
                          <Typography variant="caption">
                            Ag: {payment.bankAccount?.agency} / Conta: {payment.bankAccount?.number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit({ installmentId: payment?.codigo_movimento_detalhe })}>
                            <i className="ri-edit-2-line" />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(payment.sourceId)} color="error">
                            <i className="ri-delete-bin-line" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>

              </Table>
            </Box>
          </Paper>
        ) : (
          <Typography sx={{ p: 2, color: theme.palette.text.secondary }}>
            Nenhuma conta com id null encontrada
          </Typography>
        )}
      </Box>

      {/* Paginação fixa */}
      <Box
        sx={{
          position: 'sticky',
          zIndex: 1100,
          bottom: 0,
          backgroundColor: theme.palette.background.default
        }}
      >
        <TablePagination
          component="div"
          labelRowsPerPage="Registro por páginas"
          count={installments.response?.count || 0}
          page={installments.request?.offset || 0}
          onPageChange={(event, newPage) => {
            fetchPayments({
              limit: installments.request.limit,
              offset: newPage,
              dueDate: installments.request.dueDate
            })
          }}
          rowsPerPage={installments.request?.limit || 10}
          onRowsPerPageChange={(event) => {
            fetchPayments({
              limit: parseInt(event.target.value, 10),
              offset: 0,
              dueDate: installments.request.dueDate
            })
          }}
        />
      </Box>

      {/* Modal */}
      {selectedInstallment && (
        <EditInstallment
          open={modalOpen}
          onClose={handleCloseEditModal}
          installment={selectedInstallment}
          onSave={handleSaveEditedAmount}
        />
      )}
    </Box>
  )
}