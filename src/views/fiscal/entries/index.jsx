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
  Checkbox,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material'
import { useTitle } from '@/contexts/TitleProvider'
import * as entries from '@/app/server/fiscal/entries'
import { styles } from '@/components/styles'
import { ViewOrder } from './view.entry'
import _ from 'lodash'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import { BackdropLoading } from '@/components/BackdropLoading'

export const ViewFiscalEntries = ({ initialEntries = [] }) => {

  const [loading, setLoading] = useState(undefined)

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [data, setData] = useState(initialEntries)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [serviceId, setServiceId] = useState(undefined)

  // estados para o menu de ações
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOrderId, setMenuOrderId] = useState(null)

  useEffect(() => {
    setTitle(['Fiscal', 'Entrada/Saída'])
  }, [])

  const fetchServices = async (request) => {
    try {
      setIsFetching(true)
      const response = await entries.findAll(request)
      setData(response)
      setSelectedIds(new Set())
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetching(false)
    }
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
    const allIds = data.response?.rows.map((p) => p.id) || []
    const allSelected = allIds.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(allIds))
  }

  const handleMenuOpen = (event, orderId) => {
    setAnchorEl(event.currentTarget)
    setMenuOrderId(orderId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuOrderId(null)
  }

  const handleGenerate = async (orderId) => {
    try {

      handleMenuClose()

      setLoading('Gerando nota fiscal...')

      await orders.generate()

    } catch (error) {
      Swal.fire({ icon: 'warning', title: 'Ops!', text: error.message, confirmButtonText: 'Ok' })
    } finally {
      setLoading(undefined)
    }
  }

  const handleDelete = (orderId) => {
    handleMenuClose()
    console.log('Excluir pedido:', orderId)
    // Exemplo: await orders.destroy(orderId)
  }

  const allIds = data.response?.rows.map((p) => p.id) || []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  return (
    <>

      <BackdropLoading loading={loading} message={loading} />

      <Box sx={styles.container}>
        
        <Box sx={styles.header}>
          <Button
            variant="contained"
            startIcon={<i className="ri-add-circle-line" />}
            onClick={() => setServiceId(null)}
          >
            Adicionar
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
              onClick={() =>
                fetchServices({
                  ...data.request,
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
                  <TableCell align="center" sx={{ width: 140 }}>Data</TableCell>
                  <TableCell align="left" sx={{ width: 120 }}>Número</TableCell>
                  <TableCell>Cliente/Fornecedor</TableCell>
                  <TableCell align="center" sx={{ width: 90 }}>Valor</TableCell>
                  <TableCell align="center" sx={{ width: 90 }}></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={styles.tableCellLoader}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : (
                  _.map(data.response?.rows, (entry, index) => {
                    const isItemSelected = selectedIds.has(entry.id)

                    return (
                      <TableRow
                        key={index}
                        hover
                        onDoubleClick={() => setServiceId(entry.id)}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                        className="with-hover-actions"
                      >
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={() => toggleSelect(entry.id)}
                          />
                        </TableCell>
                        <TableCell align="center">{entry.date ? format(new Date(entry.date), 'dd/MM/yyyy HH:mm') : ""}</TableCell>
                        <TableCell align="left"><Box
        sx={{
          maxWidth: 120,   // largura limite da célula
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.documentNumber}
      </Box></TableCell>
                        <TableCell>{entry.partner?.surname}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(entry.value)}
                        </TableCell>
                        <TableCell align="center">
                          <Box className="row-actions">
                            <Tooltip title="Editar">
                              <IconButton onClick={() => setServiceId(entry.id)}>
                                <i className="ri-edit-2-line text-lg" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mais ações">
                              <IconButton onClick={(e) => handleMenuOpen(e, entry.id)}>
                                <i className="ri-more-2-line text-lg" />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && menuOrderId === entry.id}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            <MenuItem onClick={() => handleGenerate(entry.id)}>
                              <i className="ri-printer-line" />
                              Imprimir
                            </MenuItem>
                            <MenuItem onClick={() => handleGenerate(entry.id)}>
                              <i className="ri-file-text-line mr-2 text-base" />
                              Gerar Nota Fiscal
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleDelete(entry.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <i className="ri-delete-bin-line mr-2 text-base" />
                              Excluir
                            </MenuItem>
                          </Menu>
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
              count={data.response?.count || 0}
              page={data.request?.offset || 0}
              rowsPerPage={data.request?.limit || 10}
              onPageChange={(event, offset) =>
                fetchServices({ ...data.request, offset })
              }
              onRowsPerPageChange={(event) =>
                fetchServices({
                  ...data.request,
                  limit: parseInt(event.target.value),
                  offset: 0,
                })
              }
            />
          </Box>
        </Box>

        <ViewOrder
          serviceId={serviceId}
          onClose={(service) => {
            setServiceId(undefined)
            if (service) fetchServices({ ...data.request })
          }}
        />

      </Box>
    </>
  )
}
