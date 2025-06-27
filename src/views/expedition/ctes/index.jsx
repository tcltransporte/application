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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'

import { useDropzone } from 'react-dropzone'
import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { PeriodFilter } from '@/components/PeriodFilter'
import { getShippiments, onServerAddCte, onServerRemoveCte } from '@/app/server/expedition/shippiments/index.controller'

import { styles } from '@/components/styles'
import _ from 'lodash'
import { Form, Formik } from 'formik'
import { getCtes } from '@/app/server/expedition/ctes/index.controller'
import { format, parseISO } from 'date-fns'


export const ImportDrawer = ({ open, onClose }) => {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const onDrop = (acceptedFiles) => {
    const withIds = acceptedFiles.map((file, index) => ({
      file, // manter o File original aqui
      _id: `${file.name}-${file.size}-${Date.now()}-${index}`,
    }))
    setFiles((prev) => [...prev, ...withIds])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return alert('Selecione arquivos para enviar')

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))

      const res = await fetch('/api/expedition/ctes', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Erro ao enviar arquivos')

      const data = await res.json()
      setUploadResult(data)
      setFiles([])
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor="right"
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 500, maxWidth: '100%' } }}
    >
      <Box p={3} display="flex" flexDirection="column" gap={2} height="100%">
        <Typography variant="h5">Importar Arquivos</Typography>

        <Box
          {...getRootProps()}
          sx={{
            height: 100,
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? '#f0f0f0' : 'transparent',
            color: '#666',
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <Typography>Solte os arquivos aqui...</Typography>
          ) : (
            <Typography>Clique ou arraste arquivos para essa área</Typography>
          )}
        </Box>

        {_.size(files) > 0 && (
          <List
            sx={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: 1,
            }}
          >
            {files.length === 0 && (
              <ListItem>
                <ListItemText primary="Nenhum arquivo selecionado" />
              </ListItem>
            )}

            {files.map((entry, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={entry.file.name}
                  secondary={`${(entry.file.size / 1024).toFixed(2)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removeFile(index)}>
                    <i className="ri-delete-bin-line" style={{ fontSize: 20 }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
        

        <Box display="flex" justifyContent="space-between" alignItems="center" ml="auto">
          {uploading && <CircularProgress size={24} />}
          {uploadResult && (
            <Typography color="success.main" flexGrow={1} ml={2}>
              {uploadResult.uploadedFiles.length} arquivo(s) enviados com sucesso!
            </Typography>
          )}

          <Button variant="contained" onClick={handleUpload} disabled={uploading || files.length === 0}>
            Enviar arquivos
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

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

      const cte = await onServerAddCte({ shippimentId, chCTe: trimmed })

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
      await onServerRemoveCte({ cteId: cte.id })
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
                      <i className="ri-add-line" />
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
                  <TableRow key={index}>
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

export const ViewExpeditionCtes = ({ initialPayments = [] }) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)
  const [installments, setInstallments] = useState(initialPayments)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [isImportDrawerOpen, setImportDrawerOpen] = useState(false)
  const [selectedCtes, setSelectedCtes] = useState([])
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(null)

  useEffect(() => {
    setTitle(['Expedição', 'Conhecimentos'])
  }, [])

  const fetchPayments = async (request) => {
    try {
      setIsFetching(true)
      const response = await getCtes(request)
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
      dhEmi: {
        start: DateFormat(new Date(dateRange[0]), 'yyyy-MM-dd 00:00'),
        end: DateFormat(new Date(dateRange[1]), 'yyyy-MM-dd 23:59'),
      },
    })
  }

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    const allIds = installments.response?.rows.map((p) => p.codigo_carga) || []
    const allSelected = allIds.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(allIds))
  }

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
        <Button
          variant="contained"
          startIcon={<i className="ri-upload-line" />}
          onClick={() => setImportDrawerOpen(true)}
        >
          Importar
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <PeriodFilter
            title="Emissão"
            initialDateRange={[
              new Date(installments.request?.dhEmi?.start),
              new Date(installments.request?.dhEmi?.end),
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
                <TableCell align="left" sx={{ width: 150 }}>Emissão</TableCell>
                <TableCell align="left" sx={{ width: 90 }}>Número</TableCell>
                <TableCell align="left" sx={{ width: 70 }}>Serie</TableCell>
                <TableCell sx={{ width: 360 }}>Chave de acesso</TableCell>
                <TableCell>Remetente</TableCell>
                <TableCell>Destinatário</TableCell>
                <TableCell align='right'>Valor</TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
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
                  const id = payment.codigo_carga
                  const isItemSelected = selectedIds.has(id)

                  return (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => toggleSelect(id)}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => toggleSelect(id)}
                        />
                      </TableCell>
                      <TableCell>{payment.dhEmi ? format(payment.dhEmi, 'dd/MM/yyyy HH:mm') : ''}</TableCell>
                      <TableCell>{payment.nCT}</TableCell>
                      <TableCell>{payment.serie}</TableCell>
                      <TableCell>{payment.chCTe}</TableCell>
                      <TableCell>{payment.shippiment?.sender?.surname}</TableCell>
                      <TableCell>{payment.recipient?.surname}</TableCell>
                      <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.calculationBasis)}</TableCell>
                      <TableCell align="right">
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

      <ImportDrawer
        open={isImportDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
      />
    </Box>
  )
}
