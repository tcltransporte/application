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
  MenuItem,
  Divider
} from '@mui/material'
import { useTitle } from '@/contexts/TitleProvider'
import * as orders from '@/app/server/sales/orders'
import { styles } from '@/components/styles'
import { ViewOrder } from './view.order'
import _ from 'lodash'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import { BackdropLoading } from '@/components/BackdropLoading'
import { Drawer } from '@/components/Drawer'


const DfeDrawer = ({ order, onClose }) => {
  
  return (
    <Drawer
      open={order}
      title={'Documentos'}
      onClose={onClose}
      width={'780px'}
    >
     
      <Box sx={{ p: 3 }}>

        {_.size(order?.orderFiscals) > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 8, p: 0 }}></TableCell>
                <TableCell sx={{ width: 130 }}>Data</TableCell>
                <TableCell sx={{ width: 70 }}>Tipo</TableCell>
                <TableCell sx={{ width: 50 }}>Número</TableCell>
                <TableCell>Chave de acesso</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

          <TableBody>
            {_.map(order?.orderFiscals, (fiscal, index) => {

              const statusColor =
                _.get(fiscal, 'fiscal.status') === 100
                  ? 'success.main'
                  : _.get(fiscal, 'fiscal.status') === 500
                  ? 'error.main'
                  : 'grey.400'

              return (
                <Tooltip
                  key={index}
                  title={_.get(fiscal, 'fiscal.reason')}
                  placement="left"
                  arrow
                >
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer' }}
                    className="with-hover-actions"
                  >
                    <TableCell sx={{ position: 'relative', p: 0, width: 8 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,          // margem superior
                          bottom: 4,       // margem inferior
                          left: 0,
                          width: 6,
                          borderRadius: 1,
                          backgroundColor: statusColor
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      {_.get(fiscal, 'fiscal.date')
                        ? format(new Date(_.get(fiscal, 'fiscal.date')), 'dd/MM/yyyy HH:mm')
                        : ""}
                    </TableCell>

                    <TableCell>
                      {_.get(fiscal, 'fiscal.documentTemplate.acronym', '')}
                    </TableCell>

                    <TableCell>
                      {_.get(fiscal, 'fiscal.documentNumber', '')}
                    </TableCell>

                    <TableCell
                      sx={{
                        fontFamily: 'monospace',
                        letterSpacing: '-0.6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {_.get(fiscal, 'fiscal.accessKey', '')}
                    </TableCell>

                    <TableCell align="center">
                      <Box className="row-actions">
                        <Tooltip title="Visualizar PDF">
                          <IconButton
                            size="large"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDacte({ id: payment.id })
                            }}
                          >
                            <i
                              className="ri-file-pdf-2-line"
                              style={{ fontSize: 20, color: '#d32f2f' }}
                            />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Baixar XML">
                          <IconButton
                            size="large"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload({ id: payment.id })
                            }}
                          >
                            <i className="ri-download-2-line" style={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </Tooltip>
              )
            })}
          </TableBody>
        </Table>

        ) : (
          <Typography variant="body2" color="textSecondary">
            Nenhum documento encontrado!
          </Typography>
        )}
      </Box>
    </Drawer>
  )
}

export const ViewSalesOrders = ({ initialOrders = [] }) => {

  const [loading, setLoading] = useState(undefined)

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [data, setData] = useState(initialOrders)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [serviceId, setServiceId] = useState(undefined)

  const [order, setOrder] = useState(undefined)

  // estados para o menu de ações
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOrderId, setMenuOrderId] = useState(null)

  useEffect(() => {
    setTitle(['Vendas', 'Pedidos'])
  }, [])

  const fetchServices = async (request) => {
    try {
      setIsFetching(true)
      const response = await orders.findAll(request)
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

      await orders.generate(orderId)

      fetchServices({...data.request})

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
                  <TableCell align="left" sx={{ width: 140 }}>Data</TableCell>
                  <TableCell align="center" sx={{ width: 80 }}>Número</TableCell>
                  <TableCell sx={{ width: 200 }}>Filial</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="center" sx={{ width: 90 }}></TableCell>
                  <TableCell align="center" sx={{ width: 90 }}></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={styles.tableCellLoader}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : (
                  _.map(data.response?.rows, (order, index) => {
                    const isItemSelected = selectedIds.has(order.id)

                    return (
                      <TableRow
                        key={index}
                        hover
                        onDoubleClick={() => setServiceId(order.id)}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                        className="with-hover-actions"
                      >
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={() => toggleSelect(order.id)}
                          />
                        </TableCell>
                        <TableCell align="left">{order.date ? format(new Date(order.date), 'dd/MM/yyyy HH:mm') : ""}</TableCell>
                        <TableCell>{order.sequence}</TableCell>
                        <TableCell>{order.company?.surname}</TableCell>
                        <TableCell>{order.customer?.surname}</TableCell>
                        <TableCell align="center">

                          <IconButton onClick={() => {
                            setOrder(order)
                          }} sx={{ p: 0, width: 26, height: 26, borderRadius: '50%', fontSize: 12, backgroundColor: 'var(--mui-palette-primary-main)', color: '#fff', '&:hover': { backgroundColor: 'primary.dark' }, position: 'relative' }}>
                            <i className="ri-file-text-line" style={{ fontSize: 18 }} />
                            <Box sx={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--mui-palette-success-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
                              {_.size(order.orderFiscals)}
                            </Box>
                          </IconButton>

                        </TableCell>
                        <TableCell align="center">
                          <Box className="row-actions">
                            <Tooltip title="Editar">
                              <IconButton onClick={() => setServiceId(order.id)}>
                                <i className="ri-edit-2-line text-lg" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mais ações">
                              <IconButton onClick={(e) => handleMenuOpen(e, order.id)}>
                                <i className="ri-more-2-line text-lg" />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && menuOrderId === order.id}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                          >
                            <MenuItem onClick={() => handleGenerate(order.id)}>
                              <i className="ri-printer-line" />
                              Imprimir
                            </MenuItem>
                            <MenuItem onClick={() => handleGenerate(order.id)}>
                              <i className="ri-file-text-line mr-2 text-base" />
                              Gerar Nota Fiscal
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleDelete(order.id)}
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

        <DfeDrawer
          order={order}
          onClose={() => setOrder(undefined)}
          //ctes={selectedCtes}
        />

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
