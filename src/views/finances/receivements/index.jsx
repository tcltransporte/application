'use client'

import React, { useState, useEffect } from 'react'
import { Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper, Box, CircularProgress, Button, TablePagination, IconButton, Drawer, Divider, TextField, Checkbox } from '@mui/material'

import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { RangeFilter } from '@/components/RangeFilter'
import * as payments from '@/app/server/finances/payments'

import { styles } from '@/components/styles'
import _ from 'lodash'
import { ViewPaymentInstallment } from './view.payment-installment'
import { format, parseISO } from 'date-fns'

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
        anchor="right"
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
      >
        <div className="flex items-center justify-between pli-5 plb-4">
          <Typography variant="h5">Filtros</Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <i className="ri-close-line text-2xl" />
          </IconButton>
        </div>

        <Divider />

        <Box sx={{ p: 4 }}>
          <TextField fullWidth label="Beneficiário" />

          <TextField fullWidth label="Número documento" sx={{ mt: 2 }} />

          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              variant="contained"
              color="success"
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

export const ViewFinancesReceivements = ({ initialPayments = [] }) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [installments, setInstallments] = useState(initialPayments)
  const [installmentId, setInstallmentId] = useState(undefined)

  // Estado para armazenar os ids selecionados
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => {
    setTitle(['Finanças', 'Contas a receber'])
  }, [])

  const fetchPayments = async (request) => {
    try {
      setIsFetching(true)
      const response = await payments.findAll(request)
      setInstallments(response)
      setSelectedIds(new Set())
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetching(false)
    }
  }

  const handlePeriodChange = (dateRange) => {
    fetchPayments({
      ...installments.request,
      offset: 0,
      dueDate: {
        start: DateFormat(new Date(dateRange[0]), 'yyyy-MM-dd 00:00'),
        end: DateFormat(new Date(dateRange[1]), 'yyyy-MM-dd 23:59'),
      },
    })
  }

  const handleNew = () => {
    setInstallmentId(null)
  }

  const handleEdit = ({ installmentId }) => {
    setInstallmentId(installmentId)
  }

  // Função para alternar seleção de um registro
  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Selecionar ou desmarcar todos da página atual
  const toggleSelectAll = () => {
    const allIds = installments.response?.rows.map((p) => p.codigo_movimento_detalhe) || []
    const allSelected = allIds.every((id) => selectedIds.has(id))

    if (allSelected) {
      // Deseleciona todos
      setSelectedIds(new Set())
    } else {
      // Seleciona todos
      setSelectedIds(new Set(allIds))
    }
  }

  // Função para excluir os selecionados (aqui apenas alert para simular)
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return

    if (!window.confirm(`Deseja excluir ${selectedIds.size} registro(s) selecionado(s)?`)) return

    // Aqui você pode chamar API para deletar os selecionados, ex:
    // await deletePayments([...selectedIds])

    alert(`Excluindo registros: ${[...selectedIds].join(', ')}`)

    // Após exclusão, atualiza a lista (recarrega)
    fetchPayments(installments.request)

  }

  const allIds = installments.response?.rows.map((p) => p.codigo_movimento_detalhe) || []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  return (
    <>
    
      <ViewPaymentInstallment installmentId={installmentId} onClose={(updated) => {
        setInstallmentId(undefined)
        console.log(updated)
        if (updated == true) {
          fetchPayments(installments.request)
        }
      }} />

      <Box sx={styles.container}>
        <Box sx={styles.header}>
          <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={handleNew}>
            Adicionar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <RangeFilter
              title="Vencimento"
              initialDateRange={[
                new Date(installments.request?.dueDate?.start),
                new Date(installments.request?.dueDate?.end),
              ]}
              onChange={handlePeriodChange}
            />

            <Filter />

            <Button
              variant="outlined"
              startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
              onClick={() =>
                fetchPayments({
                  ...installments.request,
                  offset: 0,
                })
              }
              disabled={isFetching}
            >
              {isFetching ? 'Pesquisando...' : 'Pesquisar'}
            </Button>
          </Box>
        </Box>

        <Box sx={styles.tableWrapper}>
          <Paper sx={styles.paperContainer}>
            <Table sx={styles.tableLayout} stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 56, minWidth: 56, px: 1 }}>
                    <Checkbox
                      color="primary"
                      checked={allSelected}
                      indeterminate={selectedIds.size > 0 && !allSelected}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell align="left" sx={{ width: 120 }}>
                    Nº Doc.
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      width: 'auto',
                      minWidth: 180,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Beneficiário
                  </TableCell>
                  <TableCell align="left" sx={{ width: 180 }}>
                    Forma de pagamento
                  </TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>
                    Vencimento
                  </TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>
                    Agendamento
                  </TableCell>
                  <TableCell align="right" sx={{ width: 100 }}>
                    Valor
                  </TableCell>
                  <TableCell align="left" sx={{ width: 220 }}>
                    Agência/Conta
                  </TableCell>
                  <TableCell align="center" sx={{ width: 120 }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={styles.tableCellLoader}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : (
                  _.map(installments.response?.rows, (payment, index) => {
                    const id = payment.codigo_movimento_detalhe
                    const isItemSelected = selectedIds.has(id)

                    return (
                      <TableRow
                        key={id}
                        hover
                        onClick={() => toggleSelect(id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={() => toggleSelect(id)}
                          />
                        </TableCell>
                        <TableCell align="left">{payment.financialMovement?.documentNumber}</TableCell>
                        <TableCell
                          align="left"
                          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {payment.financialMovement?.partner?.surname}
                        </TableCell>
                        <TableCell align="left">{payment.paymentMethod?.name}</TableCell>
                        <TableCell align="center">{format(parseISO(payment.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell align="center">{format(parseISO(payment.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.amount)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{payment.bankAccount?.bank?.name}</Typography>
                          <Typography variant="caption">
                            Ag: {payment.bankAccount?.agency} / Conta: {payment.bankAccount?.number}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit({ installmentId: id })
                            }}
                          >
                            <i className="ri-edit-2-line" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              alert('Deletar ainda não implementado')
                            }}
                            color="error"
                          >
                            <i className="ri-delete-bin-line" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>

        <Box sx={styles.pagination}>
          
          <Box sx={{ minWidth: 220 }}>
            {selectedIds.size > 0 && (
              <Typography
                variant="subtitle1"
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  fontWeight: 500,
                  userSelect: 'none',
                }}
              >
                {selectedIds.size} registro{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>


          {/* Paginação sempre à direita */}
          <Box sx={{ ml: 'auto' }}>
            <TablePagination
              component="div"
              labelRowsPerPage="Registros por página"
              count={installments.response?.count || 0}
              page={installments.request?.offset || 0}
              rowsPerPage={installments.request?.limit || 10}
              onPageChange={(event, offset) =>
                fetchPayments({
                  ...installments.request,
                  offset: offset,
                })
              }
              onRowsPerPageChange={(event) =>
                fetchPayments({
                  ...installments.request,
                  limit: event.target.value,
                  offset: 0,
                })
              }
            />
          </Box>
        </Box>
      </Box>
    </>
  )
}
