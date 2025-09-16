'use client'

import React, { useState, useEffect } from 'react'
import { Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper, Box, CircularProgress, Button, TablePagination, IconButton, Drawer, Divider, Checkbox, FormGroup, FormControlLabel, FormControl, InputLabel, Select, OutlinedInput, MenuItem, ListItemText, FilledInput } from '@mui/material'

import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { RangeFilter } from '@/components/RangeFilter'
import * as payments from '@/app/server/finances/payments'

import { styles } from '@/components/styles'
import _ from 'lodash'
import { ViewPaymentInstallment } from './view.payment-installment'
import { format, parseISO } from 'date-fns'
import { getCompany, getFinancialCategory, getPartner, getPaymentMethod } from '@/utils/search'
import { Field, Formik } from 'formik'
import { AutoComplete, SelectField, TextField } from '@/components/field'

const statusOptions = [
  { label: 'Em aberto', value: 0 },
  { label: 'Pago', value: 1 },
]

const Filter = ({ request: initialRequest, onApply }) => {

  const [open, setOpen] = useState(false)

  const openDrawer = () => setOpen(true)
  const closeDrawer = () => setOpen(false)

  return (
    <>
      <Button
        variant="text"
        startIcon={<i className="ri-equalizer-line" />}
        onClick={openDrawer}
      >
        Filtros
      </Button>

      <Drawer
        open={open}
        anchor="right"
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
        onClose={closeDrawer}
      >
        <div className="flex items-center justify-between pli-5 plb-4">
          <Typography variant="h5">Filtros</Typography>
          <IconButton size="small" onClick={closeDrawer}>
            <i className="ri-close-line text-2xl" />
          </IconButton>
        </div>

        <Divider />

        <Formik
          initialValues={{
            company: initialRequest?.company || null,
            documentNumber: initialRequest?.documentNumber || '',
            receiver: initialRequest?.receiver || null,
            category: initialRequest?.category || null,
            observation: initialRequest?.observation || '',
            status: initialRequest?.status || [],
          }}
          onSubmit={(values) => {
            onApply(values)
            closeDrawer()
          }}
        >
          {({ values, setFieldValue, handleChange, handleSubmit, touched, errors }) => (
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>

              <Field
                as={AutoComplete}
                name="company"
                label="Filial"
                text={(company) => company?.surname || ''}
                onSearch={getCompany}
                renderSuggestion={(item) => (
                    <span>{item.surname}</span>
                )}
              />

              <Field
                as={TextField}
                label='Nº Documento'
                name='documentNumber'
                error={Boolean(touched.description && errors.description)}
                helperText={touched.description && errors.description}
              />

              <AutoComplete
                name="receiver"
                label="Beneficiário"
                value={values.receiver}
                text={(p) => p?.surname}
                onChange={(val) => setFieldValue("receiver", val)}
                onSearch={getPartner}
              >
                {(item) => <span>{item.surname}</span>}
              </AutoComplete>

              <AutoComplete
                name="category"
                label="Categoria"
                value={values.category}
                text={(category) => category?.description}
                onChange={(category) => setFieldValue("category", category)}
                onSearch={(search) => getFinancialCategory(search, 2)}
              >
                {(item) => <span>{item.description}</span>}
              </AutoComplete>

              <Field
                as={TextField}
                label='Observação'
                name='observation'
                error={Boolean(touched.observation && errors.observation)}
                helperText={touched.observation && errors.observation}
              />

              <FormControl fullWidth variant="filled" size="small" sx={{ mt: 2 }}>
                <InputLabel shrink>Status</InputLabel>
                <Select
                  multiple
                  name="status"
                  value={values.status}
                  onChange={(e) => setFieldValue('status', e.target.value)}
                  input={<FilledInput />}
                  renderValue={(selected) =>
                    selected
                      .map((val) => statusOptions.find((o) => o.value === val)?.label)
                      .filter(Boolean)
                      .join(', ')
                  }
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value} dense>
                      <Checkbox checked={values.status.includes(option.value)} />
                      <ListItemText primary={option.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display="flex" justifyContent="flex-end" mt={4}>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  startIcon={<i className="ri-check-line" />}
                >
                  Aplicar
                </Button>
              </Box>
            </Box>
          )}
        </Formik>
      </Drawer>
    </>
  )
}

export const ViewFinancesPayments = ({ initialPayments = [] }) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [installments, setInstallments] = useState(initialPayments)
  const [installmentId, setInstallmentId] = useState(undefined)

  // Estado para armazenar os ids selecionados
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => {
    setTitle(['Finanças', 'Contas a pagar'])
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
        start: dateRange[0],
        end: dateRange[1],
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
                installments.request?.dueDate?.start,
                installments.request?.dueDate?.end,
              ]}
              onChange={handlePeriodChange}
            />

            <Filter request={installments.request} onApply={(request) => fetchPayments({
              ...installments.request,
              ...request,
              offset: 0,
            })} />

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
                <TableRow className="with-hover-actions">
                  <TableCell sx={{ width: 56, minWidth: 56, px: 1 }} align="center"><Checkbox color="primary" checked={allSelected} indeterminate={selectedIds.size > 0 && !allSelected} onChange={toggleSelectAll}/></TableCell>
                  <TableCell sx={{ width: 80 }} align="left">Nº Doc.</TableCell>
                  <TableCell sx={{ width: 'auto', minWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} align="left">Filial / Beneficiário</TableCell>
                  <TableCell sx={{ width: 240 }} align="left">Categoria</TableCell>
                  <TableCell sx={{ width: 100 }} align="left">Tipo</TableCell>
                  <TableCell sx={{ width: 100 }} align="center">Vencimento</TableCell>
                  <TableCell sx={{ width: 100 }} align="center">Agendamento</TableCell>
                  <TableCell sx={{ width: 80  }} align="right">Valor</TableCell>
                  <TableCell sx={{ width: 180 }} align="left">Agência / Conta</TableCell>
                  <TableCell sx={{ width: 120 }} align="center" />
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
                        key={index}
                        hover
                        onClick={() => toggleSelect(id)}
                        onDoubleClick={() => handleEdit({ installmentId: id })}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                        className="with-hover-actions"
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox color="primary" checked={isItemSelected} onChange={() => toggleSelect(id)} />
                        </TableCell>
                        <TableCell align="left">{payment.financialMovement?.documentNumber}</TableCell>
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{payment.financialMovement?.partner?.surname}</TableCell>
                        {/*
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Typography variant="body2">{payment.financialMovement?.company?.surname}</Typography>
                          <Typography>
                            {payment.financialMovement?.partner?.surname}
                          </Typography>
                        </TableCell>
                        */}
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{payment.financialMovement?.category?.description}</TableCell>
                        <TableCell align="left">{payment.paymentMethod?.name}</TableCell>
                        <TableCell align="center">{format(parseISO(payment.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.amount)}</TableCell>
                        <TableCell>
                          {payment.bankAccount && (
                            <>
                              <Typography>{payment.bankAccount?.bank?.name}</Typography>
                              <Typography variant="body2">
                                {payment.bankAccount?.agency} / {payment.bankAccount?.number}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box className="row-actions">
                            <IconButton size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit({ installmentId: id })
                              }}
                            >
                              <i className="ri-edit-2-line" />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation()
                                alert('Deletar ainda não implementado')
                              }}
                              color="error"
                            >
                              <i className="ri-delete-bin-line" />
                            </IconButton>
                          </Box>
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