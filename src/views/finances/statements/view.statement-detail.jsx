// view.statement-detail.jsx
'use client'

import {
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, Collapse, CircularProgress, Typography,
  DialogActions, Select, MenuItem, TextField, Paper, Grid, Backdrop,
  Badge,
  Tooltip,
} from '@mui/material'
import { format } from 'date-fns'
import { Fragment, useEffect, useState } from 'react'
//import { deleteStatementConciled, getStatement, saveStatementConciled } from './view.statement-detail.controller'
import { toast } from 'react-toastify'
import { AutoComplete } from '@/components/AutoComplete'
import { getFinancialCategory, getPartner, getUser } from '@/utils/search'
import { ItemDetailDrawer } from './ItemDetailDrawer' // Import o novo componente
import { deleteStatementConciled, getStatement, saveStatementConciled } from '@/app/server/finances/statements/view.statement-detail.controller'

const entryTypeAlias = {
  '': {
    title: 'Abertura e fechamento',
    content: 'A',
  },
  'payment': {
    title: 'Recebimento',
    content: 'R',
  },
  'shipping': {
    title: 'Frete',
    content: 'F',
  },
  'payout': {
    title: 'Transferência',
    content: 'T',
  },
  'reserve_for_payout': {
    title: 'Reserva para transferência',
    content: 'T',
  },
  'reserve_for_bpp_shipping_return': {
    title: 'Reserva para devolução',
    content: 'D',
  }
}

// Formatador de moeda sem símbolo R$
const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const typeDescription = (raw) => {
  switch (raw) {
    case 'transfer': return 'Transferência'
    case 'payment': return 'Pagamento'
    case 'receivement': return 'Recebimento'
    default: return raw
  }
}

export function ViewStatementDetail({ statementId, onClose, onError }) {

  const [loading, setLoading] = useState(false)
  const [statement, setStatement] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [entryTypeFilters, setEntryTypeFilters] = useState([])
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [newConciledInput, setNewConciledInput] = useState({})
  const [editingConciled, setEditingConciled] = useState({})

  // State para o novo drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)

  useEffect(() => {
    const fetchStatement = async () => {
      try {
        setLoading(true)
        if (statementId) {
          const statement = await getStatement({ statementId })

          setOriginalData(statement.statementData)
          // Inicialmente, já aplicar filtro (ou carregar todos)
          const filteredData = statement.statementData.filter((data) =>
            statement.entryTypes?.length > 0 ? statement.entryTypes.includes(data.entryType) : true
          )

          setStatement({
            ...statement,
            statementData: filteredData,
            entryTypes: statement.entryTypes ?? [],
          })
          setEntryTypeFilters(statement.entryTypes ?? [])
        }
      } catch (error) {
        toast.error(error.message)
        onError()
      } finally {
        setLoading(false)
      }
    }

    fetchStatement()
  }, [statementId])


  const toggleExpand = (idx) => {
    setExpandedRow((prev) => (prev === idx ? null : idx))
  }

  const handleAddConciled = (idx) => {
    setNewConciledInput((prev) => ({
      ...prev,
      [idx]: { type: '', partner: null, category: null, amount: '', fee: '', discount: '' },
    }))
  }

  const handleInputChange = (idx, field, value) => {
    if (editingConciled[idx]) {
      setEditingConciled((prev) => ({
        ...prev,
        [idx]: {
          ...prev[idx],
          values: { ...prev[idx].values, [field]: value },
        },
      }))
    } else {
      setNewConciledInput((prev) => ({
        ...prev,
        [idx]: { ...prev[idx], [field]: value },
      }))
    }
  }

  const updateStatementAfterSave = (idx, updatedConciled, editIndex = null) => {
    const updated = [...statement.statementData]
    if (editIndex !== null) {
      updated[idx].concileds[editIndex] = updatedConciled
    } else {
      updated[idx].concileds.push(updatedConciled)
    }
    setStatement({ ...statement, statementData: updated })
  }

  const handleCancelConciledEdit = (idx) => {
    setEditingConciled((prev) => {
      const copy = { ...prev }
      delete copy[idx]
      return copy
    })
  }

  const handleCancelConciledAdd = (idx) => {
    setNewConciledInput((prev) => {
      const copy = { ...prev }
      delete copy[idx]
      return copy
    })
  }

  const applyEntryTypeFilter = () => {
    const filteredData = originalData.filter((data) =>
      entryTypeFilters.includes(data.entryType)
    )
    setStatement((prev) => ({
      ...prev,
      entryTypes: entryTypeFilters,
      statementData: filteredData,
    }))
    setShowFilterDialog(false)
  }

  // Nova função para abrir o drawer
  const handleOpenDrawer = (id) => {
    setSelectedItemId(id)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedItemId(null)
  }

  return (
    <>
      {loading && (
        <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff' }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ mt: 2, color: '#fff' }}>&nbsp;Carregando...</Typography>
        </Backdrop>
      )}

      <Dialog
        open={statementId !== undefined && !loading}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        scroll="paper"
        PaperProps={{
          sx: {
            position: 'fixed',
            top: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            margin: 0,
            maxHeight: 'calc(100vh - 64px)',
          },
        }}
      >
        <DialogTitle>Extrato Detalhado</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Taxa</TableCell>
                <TableCell>Crédito</TableCell>
                <TableCell>Débito</TableCell>
                <TableCell>Saldo</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(statement?.statementData || []).map((data, index) => (
                <Fragment key={index}>
                  <TableRow>
                    <TableCell style={{ width: '140px' }}>{data.sourceId}</TableCell>
                    <TableCell>{format(data.entryDate, 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{data.orderId ? `Ref. pedido #${data.orderId}` : ''}</TableCell>
                    <TableCell align="right">{formatCurrency(data.amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(data.fee)}</TableCell>
                    <TableCell align="right">{formatCurrency(data.credit)}</TableCell>
                    <TableCell align="right">{formatCurrency(data.debit)}</TableCell>
                    <TableCell align="right">{formatCurrency(data.balance)}</TableCell>
                    <TableCell align='right' style={{ width: '100px' }}>
                      <Tooltip title={entryTypeAlias[data.entryType]?.title || data.entryType}>
                        <Badge
                          color="primary"
                          badgeContent={entryTypeAlias[data.entryType]?.content || '?'}
                          sx={{ '& .MuiBadge-badge': { right: 10, fontWeight: 'bold' } }}
                        >
                        </Badge>
                      </Tooltip>
                      <IconButton size='large' onClick={() => toggleExpand(index)}>
                        {expandedRow === index
                          ? <i className="ri-arrow-up-circle-line" />
                          : <i className="ri-arrow-down-circle-line" />
                        }
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {expandedRow === index && (
                    <ExpandedRow
                      index={index}
                      data={data}
                      input={newConciledInput[index]}
                      editing={editingConciled[index]}
                      onAdd={handleAddConciled}
                      onChange={handleInputChange}
                      onConfirm={async (input, editIndex = null) => {
                        try {
                          const saved = await saveStatementConciled(data.id, input)
                          updateStatementAfterSave(index, saved, editIndex)
                          editIndex !== null
                            ? handleCancelConciledEdit(index)
                            : handleCancelConciledAdd(index)
                        } catch (error) {
                          toast.error(error.message)
                        }
                      }}
                      onCancelAdd={handleCancelConciledAdd}
                      onCancelEdit={handleCancelConciledEdit}
                      onStartEdit={(editIndex, item) =>
                        setEditingConciled((prev) => ({
                          ...prev,
                          [index]: { editIndex, values: { ...item } },
                        }))
                      }
                      onDelete={async (item) => {
                        try {

                          await deleteStatementConciled({ id: item.id })
                          
                          setStatement((prev) => {
                            const updatedData = [...prev.statementData]
                            const concileds = updatedData[index].concileds.filter((c) => c.id !== item.id)
                            updatedData[index] = { ...updatedData[index], concileds }
                            return { ...prev, statementData: updatedData }
                          })

                          toast.success('Registro excluído com sucesso')
                        } catch (error) {
                          toast.error(error.message)
                        }
                      }}
                      onViewDetails={handleOpenDrawer} // Passa o novo handler
                    />
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <IconButton
            onClick={() => {
              setEntryTypeFilters(statement?.entryTypes ?? [])
              setShowFilterDialog(true)
            }}
            size="small"
          >
            <i className="ri-filter-line" />
          </IconButton>

          <div>
            <Button variant="text" onClick={onClose}>Desconciliar</Button>
            <Button variant="contained" color="success" onClick={onClose} sx={{ ml: 1 }}>Conciliar</Button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Filtro de Tipos */}
      <Dialog open={showFilterDialog} onClose={() => setShowFilterDialog(false)}>
        <DialogTitle>Tipos de lançamentos</DialogTitle>
        <DialogContent>
          {statement?.allEntryTypes?.map((type) => {
            const isChecked = entryTypeFilters.includes(type)
            return (
              <div key={type}>
                <label>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      setEntryTypeFilters((prev) =>
                        e.target.checked
                          ? [...prev, type]
                          : prev.filter((t) => t !== type)
                      )
                    }}
                  />
                  &nbsp;{entryTypeAlias[type] ? `${entryTypeAlias[type]?.content || ''} - ${entryTypeAlias[type].title}` : type}
                </label>
              </div>
            )
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFilterDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={applyEntryTypeFilter}>Aplicar</Button>
        </DialogActions>
      </Dialog>

      {/* Item Detail Drawer */}
      <ItemDetailDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        itemId={selectedItemId}
        // Use ModalProps para garantir que o z-index seja aplicado corretamente
        container={document.body}
        ModalProps={{
          sx: {
            zIndex: 99999, // <<< Aumentado drasticamente para depuração
          },
        }}
      />
    </>
  )
}

// O restante do seu arquivo (ExpandedRow, ConciliationForm) permanece igual...
function ExpandedRow({ index, data, input, editing, onAdd, onChange, onConfirm, onCancelAdd, onCancelEdit, onStartEdit, onDelete, onViewDetails }) {
  return (
    <TableRow>
      <TableCell colSpan={9} sx={{ p: 0 }}>
        <Collapse in>
          <Table size="small" sx={{ mb: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Taxa</TableCell>
                <TableCell>Desconto</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.concileds || []).map((item, i) =>
                editing?.editIndex === i ? (
                  <ConciliationForm
                    key={`edit-${i}`}
                    statementDataId={data.id}
                    index={index}
                    input={editing.values}
                    onChange={onChange}
                    onConfirm={() => onConfirm(editing.values, i)}
                    onCancel={() => onCancelEdit(index)}
                  />
                ) : (
                  <TableRow key={i}>
                    <TableCell>{typeDescription(item.type)}</TableCell>
                    <TableCell>{item.partner?.surname}<br></br>{item.category?.description}</TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.fee)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.discount)}</TableCell>
                    <TableCell>
                      <Tooltip title='Editar'>
                        <IconButton onClick={() => onStartEdit(i, item)}>
                          <i className="ri-pencil-line" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Excluir'>
                        <IconButton onClick={() => onDelete(item)}>
                          <i className="ri-delete-bin-line" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Vincular'>
                        <IconButton onClick={() => onViewDetails(item.id)}> {/* Passa item.id aqui */}
                          <i className="ri-search-line" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              )}

              {input ? (
                <ConciliationForm
                  statementDataId={data.id}
                  index={index}
                  input={input}
                  onChange={onChange}
                  onConfirm={() => onConfirm(input)}
                  onCancel={() => onCancelAdd(index)}
                />
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Button
                      variant="text"
                      startIcon={<i className="ri-add-circle-line" />}
                      onClick={() => onAdd(index)}
                    >
                      Adicionar
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Collapse>
      </TableCell>
    </TableRow>
  )
}

function ConciliationForm({ statementDataId, index, input, onChange, onConfirm, onCancel }) {
  const [localInput, setLocalInput] = useState(input || {})
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    setLocalInput(input || {})
  }, [input])

  const handleChange = (field, value) => {
    const updated = { ...localInput, [field]: value }
    setLocalInput(updated)
    onChange(index, field, value)
  }

  const handleConfirm = async () => {
    setLocalLoading(true)
    try {
      await onConfirm()
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <TableRow>
      <TableCell colSpan={9} sx={{ p: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={1.8}>
              <Select
                fullWidth
                size="small"
                value={localInput.type || ''}
                onChange={(e) => handleChange('type', e.target.value)}
                displayEmpty
              >
                <MenuItem value="">[Selecione]</MenuItem>
                <MenuItem value="payment">Pagamento</MenuItem>
                <MenuItem value="receivement">Recebimento</MenuItem>
                <MenuItem value="transfer">Transferência</MenuItem>
              </Select>
            </Grid>

            {localInput.type !== '' && (
              <>
                <Grid item xs={12} sm={2.8}>
                  <AutoComplete
                    size="small"
                    variant="outlined"
                    placeholder="Cliente"
                    value={localInput.partner}
                    text={(partner) => partner.surname}
                    onChange={(partner) => handleChange('partner', partner)}
                    onSearch={getPartner}
                  >
                    {(item) => <span>{item.surname}</span>}
                  </AutoComplete>

                  <AutoComplete
                    size="small"
                    variant="outlined"
                    placeholder="Categoria"
                    value={localInput.category}
                    text={(category) => category.description}
                    onChange={(category) => handleChange('category', category)}
                    onSearch={getFinancialCategory}
                  >
                    {(item) => <span>{item.description}</span>}
                  </AutoComplete>
                </Grid>

                <Grid item xs={12} sm={1.31}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Valor"
                    value={localInput.amount || ''}
                    onChange={(e) => handleChange('amount', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={1.31}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Taxa"
                    value={localInput.fee || ''}
                    onChange={(e) => handleChange('fee', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={1.31}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    placeholder="Desconto"
                    value={localInput.discount || ''}
                    onChange={(e) => handleChange('discount', e.target.value)}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={1}>
              <Tooltip title='Confirmar'>
                <IconButton color="success" size="small" onClick={handleConfirm} disabled={localLoading}>
                  {localLoading ? <CircularProgress size={18} /> : <i className="ri-check-line" />}
                </IconButton>
              </Tooltip>
              <Tooltip title='Cancelar'>
                <IconButton color="error" size="small" onClick={onCancel} disabled={localLoading}>
                  <i className="ri-close-line" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>
      </TableCell>
    </TableRow>
  )
}