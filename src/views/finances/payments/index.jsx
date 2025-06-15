'use client'

import React, { useState, useEffect } from 'react'
import { Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper, Box, CircularProgress, Button, TablePagination, IconButton, Drawer, Divider, TextField } from '@mui/material'

import { useTheme } from '@mui/material/styles'
import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { PeriodFilter } from '@/components/PeriodFilter'
import { getPayments } from '@/app/server/finances/payments/index.controller'

import { styles } from '@/components/styles'
import _ from 'lodash'
import { ViewPaymentInstallment } from './view.payment-installment'

const Filter = () => {

  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="text"
        startIcon={<i className="ri-equalizer-line" />}
        onClick={() => setOpen(true)}
      >
        Filtros
      </Button>
      
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
      >
    
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Filtros</Typography>
          <IconButton size='small' onClick={() => setOpen(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>

        <Divider />

        <Box sx={{p: 4}}>

          <TextField fullWidth label="Beneficiário" />

          <TextField fullWidth label="Número documento" sx={{ mt: 2 }} />

          <Box display="flex" justifyContent="flex-end" mt={4}>

            <Button
              variant="contained"
              color='success'
              startIcon={<i className="ri-check-line" />}
              onClick={() => setOpen(false)}
            >
              Aplicar
            </Button>

          </Box>

        </Box>
      </Drawer>
    </>
  )
}

export const ViewFinancesPayments = ({ initialPayments = [] }) => {

  const theme = useTheme()

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [installments, setInstallments] = useState(initialPayments)

  const [installmentId, setInstallmentId] = useState(undefined)

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

  const handlePeriodChange = (dateRange) => {
    fetchPayments({
      limit: installments.request.limit,
      offset: 0,
      dueDate: {
        start: DateFormat(new Date(dateRange[0]), 'yyyy-MM-dd 00:00'),
        end: DateFormat(new Date(dateRange[1]), 'yyyy-MM-dd 23:59')
      }
    })
  }

  const handleNew = () => {
    setInstallmentId(null)
  }

  const handleEdit = ({ installmentId }) => {
    setInstallmentId(installmentId)
  }

  return (
    <>

      <ViewPaymentInstallment installmentId={installmentId} onClose={() => setInstallmentId(undefined)} />

      <Box sx={styles.container(theme)}>

        <Box sx={styles.header(theme)}>

          <Button
            variant="contained"
            startIcon={<i className="ri-add-circle-line" />}
            onClick={handleNew}
          >
            Adicionar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>

            <PeriodFilter
              title="Vencimento"
              initialDateRange={[ new Date(installments.request?.dueDate?.start), new Date(installments.request?.dueDate?.end) ]}
              onChange={handlePeriodChange}
            />

            <Filter />

            <Button
              variant="outlined"
              startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
              onClick={() => fetchPayments({ limit: installments.request.limit, offset: 0, dueDate: installments.request.dueDate })}
              disabled={isFetching}
            >
              {isFetching ? 'Pesquisando...' : 'Pesquisar'}
            </Button>

          </Box>

        </Box>

        <Box sx={styles.tableWrapper(theme)}>
          <Paper sx={styles.paperContainer(theme)}>
            <Table sx={styles.tableLayout(theme)} stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="left" sx={{ width: 120 }}>Nº Doc.</TableCell>
                  <TableCell align="left" sx={{ width: 'auto', minWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Beneficiário</TableCell>
                  <TableCell align="left" sx={{ width: 180 }}>Forma de pagamento</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>Vencimento</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>Agendamento</TableCell>
                  <TableCell align="right" sx={{ width: 100 }}>Valor</TableCell>
                  <TableCell align="left" sx={{ width: 220 }}>Agência/Conta</TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={styles.tableCellLoader}>
                      <CircularProgress size={30} /></TableCell>
                  </TableRow>
                  ) : (
                  _.map(installments.response?.rows, (payment, index) => (
                    <TableRow key={index}>
                      <TableCell align="left">{payment.numero_documento}</TableCell>
                      <TableCell align="left" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{payment.financialMovement?.partner?.surname}</TableCell>
                      <TableCell align="left">{payment.paymentMethod?.name}</TableCell>
                      <TableCell align="center">{DateFormat(new Date(payment.dueDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell align="center">{DateFormat(new Date(), 'dd/MM/yyyy')}</TableCell>
                      <TableCell align="right">{payment.amount?.toFixed(2)}</TableCell><TableCell><Typography variant="body2">{payment.bankAccount?.bank?.name}</Typography><Typography variant="caption">Ag: {payment.bankAccount?.agency} / Conta: {payment.bankAccount?.number}</Typography></TableCell>
                      <TableCell align="center"><IconButton size='small' onClick={() => handleEdit({ installmentId: payment.codigo_movimento_detalhe })}><i className="ri-edit-2-line" /></IconButton><IconButton size='small' onClick={() => alert('Deletar ainda não implementado')} color="error"><i className="ri-delete-bin-line" /></IconButton></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>

        <Box sx={styles.pagination(theme)}>
          <TablePagination
            component="div"
            labelRowsPerPage="Registros por página"
            count={installments.response?.count || 0}
            page={installments.request?.offset || 0}
            rowsPerPage={installments.request?.limit || 10}
            onPageChange={(event, offset) =>
              fetchPayments({
                limit: installments.request.limit,
                offset: offset,
                dueDate: installments.request.dueDate,
              })
            }
            onRowsPerPageChange={(event) =>
              fetchPayments({
                limit: event.target.value,
                offset: 0,
                dueDate: installments.request.dueDate,
              })
            }
          />
        </Box>

      </Box>

    </>

  )

}