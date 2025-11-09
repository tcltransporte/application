'use client'

import React, { useState, useEffect } from 'react'
import {
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
  CircularProgress,
  Button,
  TablePagination,
  IconButton,
  Drawer,
  Divider,
  TextField,
  Checkbox,
  Badge,
} from '@mui/material'

import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { RangeFilter } from '@/components/RangeFilter'
import * as shippiments from '@/app/server/expedition/shippiments'

import { styles } from '@/components/styles'
import _ from 'lodash'
import { Form, Formik } from 'formik'
import { ViewShippiment } from './view.shippiment'

const CteDrawer = ({ shippimentId, open, onClose, ctes = [], onAddCte, onRemoveCte }) => {
  const [removingIds, setRemovingIds] = useState(new Set())

  const handleAdd = async (values, { setSubmitting, resetForm }) => {
    try {
      const trimmed = values.chCTe.trim()

      if (!trimmed || trimmed.length !== 44) {
        alert('Informe um chCTe válido com 44 caracteres.')
        return
      }

      if (ctes.some((c) => c.chCTe === trimmed)) {
        alert('CT-e já adicionado.')
        return
      }

      const cte = await shippiments.addCte({ shippimentId, chCTe: trimmed })

      onAddCte?.({ id: cte.id, chCTe: trimmed })

      resetForm()

    } catch (error) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (cte) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(cte.id))
      await shippiments.removeCte({ cteId: cte.id })
      onRemoveCte?.(cte)
    } catch (error) {
      alert(error.message)
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(cte.id)
        return next
      })
    }
  }

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: '600px', maxWidth: '100%' } }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" px={3} py={2}>
        <Typography variant="h5">Conhecimentos</Typography>
        <IconButton onClick={onClose}>
          <i className="ri-close-line text-2xl" />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 3 }}>
        <Formik
          initialValues={{ chCTe: '' }}
          onSubmit={handleAdd}
        >
          {({ values, handleChange, isSubmitting }) => (
            <Form>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  name="chCTe"
                  label="Chave de acesso"
                  value={values.chCTe}
                  onChange={handleChange}
                  inputProps={{ maxLength: 44 }}
                  disabled={isSubmitting}
                />
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <i className="ri-add-circle-line" />
                    )
                  }
                  sx={{ height: 'auto', alignSelf: 'center', whiteSpace: 'nowrap' }}
                >
                  {isSubmitting ? 'Adicionando' : 'Adicionar'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>

        {ctes.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Chave de acesso</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ctes.map((cte, index) => {
                const isRemoving = removingIds.has(cte.id)
                return (
                  <TableRow key={cte.id || index}>
                    <TableCell>{cte.chCTe || 'Aguardando envio'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(cte)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <CircularProgress size={20} color="error" />
                        ) : (
                          <i className="ri-delete-bin-line" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Nenhum CT-e encontrado.
          </Typography>
        )}
      </Box>
    </Drawer>
  )
}

export const ViewExpeditionShippiments = ({ initialPayments = [] }) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [installments, setInstallments] = useState(initialPayments)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Estado para controle do Drawer
  const [shippimentId, setShippimentId] = useState(undefined)
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [selectedCtes, setSelectedCtes] = useState([])
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(null)

  useEffect(() => {
    setTitle(['Expedição', 'Romaneios'])
  }, [])

  const fetchPayments = async (request) => {
    try {
      setIsFetching(true)
      const response = await shippiments.findAll(request)
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

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    const allIds = installments.response?.rows.map((p) => p.codigo_carga) || []
    const allSelected = allIds.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(allIds))
  }

  // Atualiza só o registro selecionado (deep clone do array de ctes)
  const updateInstallmentCtes = (newCtes) => {
    const clonedCtes = newCtes.map((cte) => ({ ...cte }))

    setSelectedCtes(clonedCtes)

    const updatedRows = installments.response.rows.map((row) => {
      if (row.codigo_carga === selectedInstallmentId) {
        return { ...row, ctes: clonedCtes }
      }
      return row
    })

    setInstallments((prev) => ({
      ...prev,
      response: {
        ...prev.response,
        rows: updatedRows,
      },
    }))
  }

  const allIds = installments.response?.rows.map((p) => p.codigo_carga) || []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        
        <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={() => setShippimentId(null)}>
          Adicionar
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <RangeFilter
            title="Vencimento"
            initialDateRange={[
              //new Date(installments.request?.dueDate?.start),
              //new Date(installments.request?.dueDate?.end),
            ]}
            onChange={handlePeriodChange}
          />
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
                <TableCell align="center" sx={{ width: 56 }}>
                  <Checkbox
                    color="primary"
                    checked={allSelected}
                    indeterminate={selectedIds.size > 0 && !allSelected}
                    onChange={toggleSelectAll}
                  />
                </TableCell>
                <TableCell align="left" sx={{ width: 120 }}>Doc. Transporte</TableCell>
                <TableCell align="left" sx={{ width: 360 }}>Remetente</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="left" sx={{ width: 300 }}>Produto Predominante</TableCell>
                <TableCell align="center" sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={styles.tableCellLoader}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : (
                _.map(installments.response?.rows, (payment, index) => {
                  const id = payment.codigo_carga
                  const isItemSelected = selectedIds.has(id)

                  return (
                    <TableRow
                      key={id}
                      hover
                      onClick={() => toggleSelect(id)}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => toggleSelect(id)}
                        />
                      </TableCell>
                      <TableCell align="left" sx={{ width: 120 }}>{payment.documentNumber}</TableCell>
                      <TableCell align="left" sx={{ width: 360 }}>{payment.sender?.surname}</TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell align="left" sx={{ width: 300 }}>{payment.predominant}</TableCell>
                      <TableCell align="center" sx={{ width: 60 }}>
                        <Badge
                          color="primary"
                          badgeContent={_.size(payment.ctes) || '0'}
                          sx={{ '& .MuiBadge-badge': { right: 10, fontWeight: 'bold' } }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedInstallmentId(id)
                            setSelectedCtes((payment.ctes || []).map(cte => ({ ...cte })))
                            setDrawerOpen(true)
                          }}
                          style={{ cursor: 'pointer' }}
                        />
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
            <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 500 }}>
              {selectedIds.size} registro{selectedIds.size > 1 ? 's' : ''} selecionado
              {selectedIds.size > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <TablePagination
            component="div"
            labelRowsPerPage="Registros por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`}
            count={installments.response?.count || 0}
            page={installments.request?.offset || 0}
            rowsPerPage={installments.request?.limit || 10}
            onPageChange={(event, offset) =>
              fetchPayments({ ...installments.request, offset })
            }
            onRowsPerPageChange={(event) =>
              fetchPayments({
                ...installments.request,
                limit: parseInt(event.target.value),
                offset: 0,
              })
            }
          />
        </Box>
      </Box>

      <CteDrawer
        shippimentId={selectedInstallmentId}
        open={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        ctes={selectedCtes}
        onAddCte={(newCte) => {
          const newList = [...selectedCtes, { ...newCte }]
          updateInstallmentCtes(newList)
        }}
        onRemoveCte={(cteToRemove) => {
          const newList = selectedCtes.filter((c) => c.chCTe !== cteToRemove.chCTe)
          updateInstallmentCtes(newList)
        }}
      />

      <ViewShippiment shippimentId={shippimentId} onClose={() => setShippimentId(undefined)} />

    </Box>
  )
}
