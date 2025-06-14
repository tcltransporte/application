'use client'

import { useEffect, useState } from 'react'
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Drawer, Box, TextField, Divider, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TablePagination, CircularProgress, Skeleton } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import ptBR from 'date-fns/locale/pt-BR'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameWeek } from 'date-fns'
import { ViewPaymentInstallment } from './view.payment-installment'
import { getPayments } from '@/app/server/finances/payments/index.controller'
import { useTitle } from '@/contexts/TitleProvider'

export const ViewFinancesPayments = ({initialPayments}) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)

  const [openDrawer, setOpenDrawer] = useState(false)
  const [openPeriodModal, setOpenPeriodModal] = useState(false)
  const [payments, setPayments] = useState(initialPayments)
  const [installmentId, setInstallmentId] = useState(undefined)
  const [dateRange, setDateRange] = useState([null, null])
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState('Período personalizado')

  const fetchPayments = async ({ limit, offset }) => {
    try {
      setIsFetching(true)

      const response = await getPayments({ limit, offset })
      setPayments(response)

    } catch (error) {
      console.log(error)
    } finally {
      setIsFetching(false)
    }
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

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">

        <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={() => setInstallmentId(null)}>
          Adicionar
        </Button>

        <Box display="flex" gap={3}>

          <Button variant="text" startIcon={<i className="ri-calendar-line" />} onClick={() => setOpenPeriodModal(true)}>
            {selectedPeriodLabel}
          </Button>

          <Button variant="text" startIcon={<i className="ri-equalizer-line" />} onClick={() => setOpenDrawer(true)}>
            Filtros
          </Button>

          <Button variant="outlined" startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />} onClick={() => fetchPayments({ limit: payments.request.limit, offset: 0 })} disabled={isFetching}>
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
              (payments.response?.rows || []).map((payment, index) => (
                <TableRow key={index}>
                  {/* renderização normal dos dados */}
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
              ))
            )}
          </TableBody>


        </Table>

        <TablePagination
          component="div"
          labelRowsPerPage='Registro por páginas'
          count={payments.response.count}
          page={payments.request.offset}
          onPageChange={(event, newPage) => {
            fetchPayments({limit: payments.request.limit, offset: newPage})
          }}
          rowsPerPage={payments.request.limit}
          onRowsPerPageChange={(event) => {
            fetchPayments({limit: event.target.value, offset: 0})
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
