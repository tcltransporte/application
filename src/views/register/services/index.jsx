'use client'

import React, { useState, useEffect } from 'react'
import { Typography, Table, TableHead, TableBody, TableRow, TableCell, Paper, Box, CircularProgress, Button, TablePagination, IconButton, Checkbox, Tooltip } from '@mui/material'
import { useTitle } from '@/contexts/TitleProvider'
import * as services from '@/app/server/register/services'
import { styles } from '@/components/styles'
import { ViewService } from './view.service'

import _ from 'lodash'

export const ViewRegisterService = ({ initialServices = [] }) => {

  const { setTitle } = useTitle()

  const [ isFetching, setIsFetching] = useState(false)

  const [ data, setData] = useState(initialServices)
  const [ selectedIds, setSelectedIds ] = useState(new Set())

  const [ serviceId, setServiceId ] = useState(undefined)

  useEffect(() => {
    setTitle(['Cadastros', 'Serviços'])
  }, [])

  const fetchServices = async (request) => {
    try {
      setIsFetching(true)
      const response = await services.findAll(request)
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

  const allIds = data.response?.rows.map((p) => p.id) || []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        
        <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={() => setServiceId(null)}>
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
                <TableCell>Descrição</TableCell>
                <TableCell align="center" sx={{ width: 90 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={styles.tableCellLoader}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : (
                _.map(data.response?.rows, (service, index) => {
                  
                  const isItemSelected = selectedIds.has(service.id)

                  return (
                    <TableRow
                      key={index}
                      hover
                      onDoubleClick={() => setServiceId(service.id)}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                      className="with-hover-actions"
                    >
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => toggleSelect(service.id)}
                        />
                      </TableCell>
                      <TableCell>{service.name}</TableCell>
                      <TableCell align="center">
                        <Box className="row-actions">
                            <Tooltip title="Editar">
                              <IconButton onClick={() => setServiceId(service.id)}>
                              <i className="ri-edit-2-line text-lg" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton onClick={() => handleDelete(statement.id)} color="error">
                              <i className="ri-delete-bin-line text-lg" />
                            </IconButton>
                          </Tooltip>
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

      <ViewService serviceId={serviceId} onClose={(service) => {
        setServiceId(undefined)
        if (service) fetchServices({ ...data.request })
      }} />

    </Box>
  )
}
