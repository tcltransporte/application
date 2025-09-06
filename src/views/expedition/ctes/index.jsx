'use client'

import React, { useState, useEffect, useRef, createRef } from 'react'
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
  Tooltip,
  Backdrop,
} from '@mui/material'

import { useDropzone } from 'react-dropzone'
import { useTitle } from '@/contexts/TitleProvider'
import { DateFormat } from '@/utils/extensions'
import { RangeFilter } from '@/components/RangeFilter'
import { getShippiments, onServerAddCte, onServerRemoveCte } from '@/app/server/expedition/shippiments/index.controller'

import { styles } from '@/components/styles'
import _ from 'lodash'
import { Form, Formik } from 'formik'
import { getCtes, onAddNfe, onDacte, onDeleteNfe, onDownload } from '@/app/server/expedition/ctes/index.controller'
import { format, parseISO } from 'date-fns'
import { ReportViewer } from '@/components/ReportViewer'
import { downloadFile } from '@/utils/download'
import { toast } from 'react-toastify'


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
      sx={{ '& .MuiDrawer-paper': { width: '600px', maxWidth: '100%' } }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" px={3} py={2}>
        <Typography variant="h5">Notas fiscais</Typography>
        <IconButton onClick={onClose}>
          <i className="ri-close-line text-2xl" />
        </IconButton>
      </Box>

      <Divider />

      {/*
      <Box
        {...getRootProps()}
        sx={{
          height: 100,
          border: '2px dashed #ccc',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? '#f0f0f0' : 'transparent',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input {...getInputProps()} />
        <Typography>
          {isDragActive ? 'Solte os arquivos aqui...' : 'Clique ou arraste arquivos para essa área'}
        </Typography>
      </Box>

      {_.size(files) > 0 && (
        <List
          sx={{
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
      */}

    </Drawer>
  )
}

const NfeDrawer = ({ shippimentId, open, onClose, ctes = [], onAddCte, onRemoveCte }) => {
  
  const [removingIds, setRemovingIds] = useState(new Set())

  const handleAdd = async (values, { setSubmitting, resetForm }) => {
    try {

      const trimmed = values.chNFe.trim()

      if (!trimmed || trimmed.length !== 44) {
        alert('Informe um chNFe válido com 44 caracteres.')
        return
      }

      if (ctes.some((c) => c.nfe.chNFe === trimmed)) {
        alert('NF-e já adicionado.')
        return
      }

      const cte = await onAddNfe({ cteId: shippimentId, chNFe: trimmed })

      onAddCte?.({ id: cte.id, nfe: { chNFe: trimmed } })

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
      await onDeleteNfe({ id: cte.id })
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
        <Typography variant="h5">Notas fiscais</Typography>
        <IconButton onClick={onClose}>
          <i className="ri-close-line text-2xl" />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 3 }}>
        <Formik
          initialValues={{ chNFe: '' }}
          onSubmit={handleAdd}
        >
          {({ values, handleChange, isSubmitting }) => (
            <Form>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  name="chNFe"
                  label="Chave de acesso"
                  value={values.chNFe}
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
              {ctes.map((cteNfe, index) => {
                const isRemoving = removingIds.has(cteNfe.id)
                return (
                  <TableRow key={index}>
                    <TableCell>{cteNfe.nfe.chNFe || 'Aguardando envio'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(cteNfe)}
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

  const reportViewer = useRef()

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)

  const [isLoading, setIsLoading] = useState(undefined)

  const [installments, setInstallments] = useState(initialPayments)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const [isImportDrawerOpen, setImportDrawerOpen] = useState(false)
  const [selectedCtes, setSelectedCtes] = useState([])
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(null)

  useEffect(() => {
    setTitle(['Expedição', 'Conhecimentos'])
  }, [])

  const fetchCtes = async (request) => {
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
    fetchCtes({
      ...installments.request,
      offset: 0,
      dhEmi: {
        //start: DateFormat(new Date(dateRange[0]), 'yyyy-MM-dd 00:00'),
        //end: DateFormat(new Date(dateRange[1]), 'yyyy-MM-dd 23:59'),
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

  const handleDacte = async ({id}) => {
    try {

      setIsLoading('Visualizando PDF...')

      const response = await onDacte({ id })
      reportViewer.current.visualize(response.pdf)

    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(undefined)
    }
  }

  const handleDownload = async ({id}) => {
    try {

      setIsLoading('Baixando XML...')

      const response = await onDownload({ id })

      downloadFile('application/xml', response.base64, response.fileName)

      toast.success('Baixado com sucesso!')

    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(undefined)
    }
  }

  const allIds = installments.response?.rows.map((p) => p.codigo_carga) || []
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))

  return (
    <>
      <Backdrop open={isLoading} sx={{ zIndex: 1200, color: "#fff", flexDirection: "column" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2, color: "#fff" }}>{isLoading}</Typography>
      </Backdrop>

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
            <RangeFilter
              title="Emissão"
              initialDateRange={[
                //new Date(installments.request?.dhEmi?.start),
                //new Date(installments.request?.dhEmi?.end),
              ]}
              onChange={handlePeriodChange}
            />
            <Button
              variant="outlined"
              startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
              onClick={() =>
                fetchCtes({
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
                  <TableCell align="center" sx={{ width: 50 }}>
                    <Checkbox
                      color="primary"
                      checked={allSelected}
                      indeterminate={selectedIds.size > 0 && !allSelected}
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell align="left" sx={{ width: 135 }}>Emissão</TableCell>
                  <TableCell align="left" sx={{ width: 85 }}>Número</TableCell>
                  <TableCell align="left" sx={{ width: 55 }}>Serie</TableCell>
                  <TableCell sx={{ width: 320 }}>Chave de acesso</TableCell>
                  <TableCell>Remetente</TableCell>
                  <TableCell>Destinatário</TableCell>
                  <TableCell align='right' sx={{ width: 80 }}>Valor</TableCell>
                  <TableCell align="center" sx={{ width: 100 }}></TableCell>
                  <TableCell align="center" sx={{ width: 35 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={styles.tableCellLoader}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : _.isEmpty(installments.response?.rows) ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography variant="body1" color="textSecondary" sx={{ p: 3 }}>
                        Nenhum resultado encontrado!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  _.map(installments.response?.rows, (payment, index) => {
                    const isItemSelected = selectedIds.has(payment.id)

                    return (
                      <TableRow
                        key={index}
                        hover
                        onClick={() => toggleSelect(payment.id)}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                        className="with-hover-actions"
                      >
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={() => toggleSelect(payment.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {payment.dhEmi ? format(payment.dhEmi, 'dd/MM/yyyy HH:mm') : ''}
                        </TableCell>
                        <TableCell>{payment.nCT}</TableCell>
                        <TableCell>{payment.serie}</TableCell>
                        <TableCell
                          sx={{
                            fontFamily: 'monospace',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {payment.chCTe}
                        </TableCell>
                        <TableCell
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {payment.shippiment?.sender?.surname}
                        </TableCell>
                        <TableCell
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {payment.recipient?.surname}
                        </TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(payment.calculationBasis)}
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
                        <TableCell align="right">
                          <Badge
                            color="primary"
                            badgeContent={_.size(payment.nfes) || '0'}
                            sx={{
                              '& .MuiBadge-badge': { right: 10, fontWeight: 'bold' },
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedInstallmentId(payment.id)
                              setSelectedCtes((payment.nfes || []).map((cte) => ({ ...cte })))
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
                fetchCtes({ ...installments.request, offset })
              }
              onRowsPerPageChange={(event) =>
                fetchCtes({
                  ...installments.request,
                  limit: parseInt(event.target.value),
                  offset: 0,
                })
              }
            />
          </Box>
        </Box>

        <NfeDrawer
          shippimentId={selectedInstallmentId}
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          ctes={selectedCtes}
          onAddCte={(newCte) => {
            const newList = [...selectedCtes, { ...newCte }]
            updateInstallmentCtes(newList)
          }}
          onRemoveCte={(cteToRemove) => {
            const newList = selectedCtes.filter((c) => c.id !== cteToRemove.id)
            updateInstallmentCtes(newList)
          }}
        />

        <ImportDrawer
          open={isImportDrawerOpen}
          onClose={() => setImportDrawerOpen(false)}
        />

        <ReportViewer ref={reportViewer}></ReportViewer>

      </Box>

    </>
  )
}
