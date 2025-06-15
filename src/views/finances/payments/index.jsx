'use client'

import { useEffect, useState } from 'react'
import {
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Drawer,
  Box,
  TextField,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  CircularProgress
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import ptBR from 'date-fns/locale/pt-BR'

import { ViewPaymentInstallment } from './view.payment-installment'
import { getPayments } from '@/app/server/finances/payments/index.controller'
import { useTitle } from '@/contexts/TitleProvider'
import { PeriodFilter } from '@/components/PeriodFilter'
import { format } from 'date-fns'

export const ViewFinancesPayments = ({ initialPayments }) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [payments, setPayments] = useState(initialPayments)
  const [installmentId, setInstallmentId] = useState(undefined)

  const fetchPayments = async ({ limit, offset, dueDate }) => {
    try {
      setIsFetching(true)
      const response = await getPayments({ limit, offset, dueDate })
      setPayments(response)
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleEdit = ({ installmentId }) => {
    setInstallmentId(installmentId)
  }

  const handleDelete = (id) => {
    setPayments((prev) => prev.filter((s) => s.sourceId !== id))
  }

  // Callback passado para PeriodFilter para receber atualizações do período
  const handlePeriodChange = (newDateRange) => {
    fetchPayments({
      limit: payments.request.limit,
      offset: 0,
      dueDate: {
        start: format(newDateRange[0], 'yyyy-MM-dd 00:00'),
        end: format(newDateRange[1], 'yyyy-MM-dd 23:59')
      }
    })
  }

  useEffect(() => {
    setTitle(['Finanças', 'Contas a pagar'])
  }, [setTitle])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <ViewPaymentInstallment installmentId={installmentId} onClose={() => setInstallmentId(undefined)} />

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={() => setInstallmentId(null)}>
          Adicionar
        </Button>

        <Box display="flex" gap={3} alignItems="center">

          <PeriodFilter title='Vencimento' initialDateRange={[new Date(payments.request?.dueDate?.start), new Date(payments.request?.dueDate?.end)]} onChange={handlePeriodChange} />

          <Button variant="text" startIcon={<i className="ri-equalizer-line" />} onClick={() => setOpenDrawer(true)}>
            Filtros
          </Button>

          <Button
            variant="outlined"
            startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
            onClick={() => fetchPayments({ limit: payments.request.limit, offset: 0 })}
            disabled={isFetching}
          >
            {isFetching ? 'Pesquisando...' : 'Pesquisar'}
          </Button>
        </Box>
      </Box>

      <Paper>
        <Table size="small">
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
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              (payments.response?.rows || []).map((payment, index) => {
                return (
                <TableRow key={index}>
                  <TableCell>{payment.financialMovement?.documentNumber}</TableCell>
                  <TableCell>{payment.financialMovement?.partner?.surname}</TableCell>
                  <TableCell>{payment.paymentMethod?.name}</TableCell>
                  <TableCell>{format(payment.dueDate, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(payment.dueDate, 'dd/MM/yyyy')}</TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'decimal',
                      minimumFractionDigits: 2
                    }).format(payment.amount)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{payment.bankAccount?.bank?.name}</Typography>
                    <Typography variant="caption">
                      Ag: {payment.bankAccount?.agency} / Conta: {payment.bankAccount?.number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit({ installmentId: payment.codigo_movimento_detalhe })}>
                      <i className="ri-edit-2-line" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(payment.sourceId)} color="error">
                      <i className="ri-delete-bin-line" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          labelRowsPerPage="Registro por páginas"
          count={payments.response?.count || 0}
          page={payments.request?.offset || 0}
          onPageChange={(event, newPage) => {
            fetchPayments({ limit: payments.request.limit, offset: newPage })
          }}
          rowsPerPage={payments.request?.limit || 10}
          onRowsPerPageChange={(event) => {
            fetchPayments({ limit: parseInt(event.target.value, 10), offset: 0 })
          }}
        />
      </Paper>

      {/* Drawer de filtros */}
      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box sx={{ width: 400, p: 5 }}>
          <Typography variant="h6">Filtros</Typography>
          <Divider sx={{ my: 2 }} />
          <TextField fullWidth label="Beneficiário" />
          <TextField fullWidth label="Número documento" sx={{ mt: 2 }} />
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button variant="contained" startIcon={<i className="ri-check-line" />} onClick={() => setOpenDrawer(false)}>
              Aplicar
            </Button>
          </Box>
        </Box>
      </Drawer>
    </LocalizationProvider>
  )
}