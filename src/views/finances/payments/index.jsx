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
  Tooltip,
  Drawer,
  Box,
  TextField,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import ptBR from 'date-fns/locale/pt-BR'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isSameWeek
} from 'date-fns'
import { ViewPaymentInstallment } from './view.payment-installment'
import { getPayments } from '@/app/server/finances/payments/index.controller'
import { useTitle } from '@/contexts/TitleProvider'

export const ViewFinancesPayments = ({ initialPayments }) => {
  const { setTitle } = useTitle()

  const [openDrawer, setOpenDrawer] = useState(false)
  const [openPeriodModal, setOpenPeriodModal] = useState(false)
  const [payments, setPayments] = useState(initialPayments)
  const [installmentId, setInstallmentId] = useState(undefined)
  const [dateRange, setDateRange] = useState([null, null])
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState('Período personalizado')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchPayments = async ({ limit, offset }) => {
    const response = await getPayments({ limit, offset })
    setPayments(response.data || [])
    setTotal(response.total || 0)
  }

  const updateLabelFromDateRange = (start, end) => {
    const today = new Date()
    if (!start || !end) return setSelectedPeriodLabel('Período personalizado')

    if (isSameDay(start, end) && isSameDay(start, today)) {
      setSelectedPeriodLabel('Hoje')
    } else if (isSameWeek(start, today, { weekStartsOn: 1 }) && isSameWeek(end, today, { weekStartsOn: 1 })) {
      setSelectedPeriodLabel('Essa semana')
    } else if (
      start.getMonth() === today.getMonth() &&
      start.getFullYear() === today.getFullYear() &&
      end.getMonth() === today.getMonth() &&
      end.getFullYear() === today.getFullYear()
    ) {
      setSelectedPeriodLabel('Esse mês')
    } else {
      setSelectedPeriodLabel('Período personalizado')
    }
  }

  const setPeriodToday = () => {
    const today = new Date()
    setDateRange([today, today])
    setSelectedPeriodLabel('Hoje')
  }

  const setPeriodThisWeek = () => {
    const today = new Date()
    setDateRange([startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 })])
    setSelectedPeriodLabel('Essa semana')
  }

  const setPeriodThisMonth = () => {
    const today = new Date()
    setDateRange([startOfMonth(today), endOfMonth(today)])
    setSelectedPeriodLabel('Esse mês')
  }

  const handleEdit = ({ installmentId }) => {
    setInstallmentId(installmentId)
  }

  const handleDelete = (id) => {
    setPayments((prev) => prev.filter((s) => s.sourceId !== id))
  }

  const applyPeriod = () => {
    updateLabelFromDateRange(dateRange[0], dateRange[1])
    setOpenPeriodModal(false)
  }

  useEffect(() => {
    setTitle(['Finanças', 'Contas a pagar'])
  }, [])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <ViewPaymentInstallment installmentId={installmentId} onClose={() => setInstallmentId(undefined)} />

      <Box display="flex" flexDirection="column" height="100%">
        {/* Barra de ações */}
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={() => setInstallmentId(null)}>
            Adicionar
          </Button>

          <Box display="flex" gap={2}>
            <Button variant="text" startIcon={<i className="ri-calendar-line" />} onClick={() => setOpenPeriodModal(true)}>
              {selectedPeriodLabel}
            </Button>
            <Button variant="text" startIcon={<i className="ri-equalizer-line" />} onClick={() => setOpenDrawer(true)}>
              Filtros
            </Button>
            <Button variant="outlined" startIcon={<i className="ri-search-line" />} onClick={() => fetchPayments({ limit, offset: page * limit })}>
              Pesquisar
            </Button>
          </Box>
        </Box>

        {/* Tabela com rolagem e paginação fixa */}
        <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
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
                {(payments || []).map((payment, index) => (
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
                ))}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={limit}
            onPageChange={(event, newPage) => {
              setPage(newPage)
              fetchPayments({ limit, offset: newPage * limit })
            }}
            onRowsPerPageChange={(event) => {
              const newLimit = parseInt(event.target.value, 10)
              setLimit(newLimit)
              setPage(0)
              fetchPayments({ limit: newLimit, offset: 0 })
            }}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Paper>
      </Box>

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

      {/* Modal de período */}
      <Dialog open={openPeriodModal} onClose={() => setOpenPeriodModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Período</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} mb={4}>
            <Button variant={selectedPeriodLabel === 'Hoje' ? 'contained' : 'outlined'} onClick={setPeriodToday}>Hoje</Button>
            <Button variant={selectedPeriodLabel === 'Essa semana' ? 'contained' : 'outlined'} onClick={setPeriodThisWeek}>Essa semana</Button>
            <Button variant={selectedPeriodLabel === 'Esse mês' ? 'contained' : 'outlined'} onClick={setPeriodThisMonth}>Esse mês</Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <DatePicker
                label="Data Inicial"
                value={dateRange[0]}
                onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Data Final"
                value={dateRange[1]}
                onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPeriodModal(false)}>Cancelar</Button>
          <Button onClick={applyPeriod} variant="contained" startIcon={<i className="ri-check-line" />}>Aplicar</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}
