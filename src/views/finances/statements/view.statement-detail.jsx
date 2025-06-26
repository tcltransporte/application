'use client'

import {
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, Collapse, CircularProgress, Typography,
  DialogActions, Select, MenuItem, TextField, Paper, Grid, Backdrop,
  Badge,
  Tooltip,
  Menu,
} from '@mui/material'
import { format } from 'date-fns'
import { Fragment, useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Field, Formik } from 'formik'
import * as Yup from 'yup'

// --- Importações de Componentes e Funções de Serviço (VERIFIQUE ESTES CAMINHOS) ---
// Certifique-se de que estes caminhos correspondem à estrutura do seu projeto.
import { AutoComplete } from '@/components/AutoComplete' // Caminho para o seu componente AutoComplete
import { getFinancialCategory, getPartner, getUser } from '@/utils/search' // Caminho para suas funções de busca

import { ItemDetailDrawer } from './view.vincule-payment' // Caminho para o seu ItemDetailDrawer (pode ser necessário ajustar)
import { ViewVinculeReceivement } from './view.vincule-receivement' // Caminho para o seu ItemDetailDrawer (pode ser necessário ajustar)

import { deleteStatementConciled, desvinculePayment, getStatement, saveStatementConciled, vinculePayment } from '@/app/server/finances/statements/view.statement-detail.controller' // Caminho para suas funções de controle de servidor
import { styles } from '@/components/styles' // Caminho para seus estilos globais ou objeto de estilo
import { CurrencyField } from '@/components/field'

// --- Funções Utilitárias ---
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDrawerReceivement, setIsDrawerReceivement] = useState(false)

  const [selectedItemId, setSelectedItemId] = useState(null)
  const [receivementId, setReceivementId] = useState(null)

  const fetchStatement = useCallback(async () => {
    if (statementId) {
      try {
        setLoading(true)
        const statementData = await getStatement({ statementId })
        setOriginalData(statementData.statementData)
        const filteredData = statementData.statementData.filter((data) =>
          statementData.entryTypes?.length > 0 ? statementData.entryTypes.includes(data.entryType) : true
        )
        setStatement({
          ...statementData,
          statementData: filteredData,
          entryTypes: statementData.entryTypes ?? [],
        })
        setEntryTypeFilters(statementData.entryTypes ?? [])
      } catch (error) {
        toast.error(error.message)
        onError()
      } finally {
        setLoading(false)
      }
    }
  }, [statementId, onError])

  useEffect(() => {
    fetchStatement()
  }, [fetchStatement])

  const toggleExpand = (idx) => {
    setExpandedRow((prev) => (prev === idx ? null : idx))
  }

  const handleOpenFilterDialog = () => {
    setEntryTypeFilters(statement?.entryTypes ?? [])
    setShowFilterDialog(true)
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

  const handleOpenPayments = (id) => {
    setSelectedItemId(id)
    setIsDrawerOpen(true)
  }

  const handleClosePayments = () => {
    setIsDrawerOpen(false)
    setSelectedItemId(null)
  }

  const handleOpenReceivements = (id) => {
    setSelectedItemId(id)
    setIsDrawerReceivement(true)
  }

  const handleCloseReceivements = () => {
    setIsDrawerReceivement(false)
    setSelectedItemId(null)
  }

  const handleVinculePayment = async (statementDataConciledId, id) => {
    try {
      await vinculePayment({ statementDataConciledId, codigo_movimento_detalhe: id })
      await fetchStatement()
      handleClosePayments()
      toast.success('Pagamento vinculado com sucesso!')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDesvinculePayment = async (statementDataConciledId) => {
    try {
      await desvinculePayment({ statementDataConciledId })
      await fetchStatement()
      toast.success('Pagamento desvinculado com sucesso!')
    } catch (error) {
      toast.error(error.message)
    }
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
        slotProps={{
          paper: {
            sx: {
              position: 'fixed',
              top: '32px',
              left: '50%',
              transform: 'translateX(-50%)',
              margin: 0,
              maxHeight: 'calc(100vh - 64px)',
            },
          }
        }}
      >
        <DialogTitle sx={styles.dialogTitle}>
          Extrato Detalhado
          <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose} size="large">
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 150 }}>ID</TableCell>
                <TableCell sx={{ width: 150 }}>Data</TableCell>
                <TableCell sx={{ width: 260 }}>Descrição</TableCell>
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
                  {/* Renderiza as linhas de detalhe de conciliação diretamente aqui */}
                  {expandedRow === index && (
                    <ConciledDetailRowsGroup
                      data={data}
                      onDesvincule={handleDesvinculePayment}
                      onViewDetails={handleOpenPayments}
                      onStatementUpdate={fetchStatement}
                    />
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <IconButton
            onClick={handleOpenFilterDialog}
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

      <EntryTypeFilterDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        allEntryTypes={statement?.allEntryTypes || []}
        selectedFilters={entryTypeFilters}
        onFilterChange={setEntryTypeFilters}
        onApplyFilter={applyEntryTypeFilter}
      />

      <ItemDetailDrawer
        open={isDrawerOpen}
        onClose={handleClosePayments}
        itemId={selectedItemId}
        container={document.body}
        ModalProps={{
          sx: {
            zIndex: 99999,
          },
        }}
        onSelected={handleVinculePayment}
      />

      <ViewVinculeReceivement
        open={isDrawerReceivement}
        onClose={handleCloseReceivements}
        itemId={receivementId}
        container={document.body}
        ModalProps={{
          sx: {
            zIndex: 99999,
          },
        }}
        onSelected={handleVinculePayment}
      />

    </>
  )
}

function ConciledDetailRowsGroup({ data, onDesvincule, onViewDetails, onStatementUpdate }) {
  const [newConciledInputActive, setNewConciledInputActive] = useState(false)
  const [editingConciledIndex, setEditingConciledIndex] = useState(null)
  const [editingConciledData, setEditingConciledData] = useState(null)

  const handleConciliationSubmitSuccess = () => {
    onStatementUpdate();
    setNewConciledInputActive(false);
    setEditingConciledIndex(null);
    setEditingConciledData(null);
  };

  const handleCancelForm = () => {
    setNewConciledInputActive(false);
    setEditingConciledIndex(null);
    setEditingConciledData(null);
  };

  const handleAddConciled = () => {
    setNewConciledInputActive(true)
    setEditingConciledIndex(null)
    setEditingConciledData(null)
  }

  const handleStartEdit = (i, item) => {
    setEditingConciledIndex(i)
    setEditingConciledData(item)
    setNewConciledInputActive(false)
  }

  const handleDeleteConciled = async (item) => {
    try {
      await deleteStatementConciled({ id: item.id })
      toast.success('Registro excluído com sucesso')
      handleConciliationSubmitSuccess()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Define o número de colunas do cabeçalho principal
  const mainTableColSpan = 9; // ID, Data, Descrição, Valor, Taxa, Crédito, Débito, Saldo, Ações

  return (
    <>
      {/* Linha para o sub-cabeçalho de conciliações, ocupando a largura total da tabela principal */}
      <TableRow>
        <TableCell>Tipo</TableCell>
        <TableCell colSpan={2}>Descrição</TableCell>
        <TableCell>Valor</TableCell>
        <TableCell>Taxa</TableCell>
        <TableCell>Desconto</TableCell>
        <TableCell colSpan={3} />
      </TableRow>

      {(data.concileds || []).map((item, i) =>
        editingConciledIndex === i ? (
          <ConciliationForm
            key={`edit-${i}`}
            statementDataId={data.id}
            initialValues={editingConciledData}
            onFormSubmitted={handleConciliationSubmitSuccess}
            onCancel={handleCancelForm}
          />
        ) : (
          <ConciledItemRow
            key={i}
            item={item}
            onStartEdit={() => handleStartEdit(i, item)}
            onDelete={handleDeleteConciled}
            onDesvincule={onDesvincule}
            onViewDetails={onViewDetails}
          />
        )
      )}

      {newConciledInputActive ? (
        <ConciliationForm
          statementDataId={data.id}
          initialValues={{ type: '', partner: null, category: null, amount: '', fee: '', discount: '' }}
          onFormSubmitted={handleConciliationSubmitSuccess}
          onCancel={handleCancelForm}
        />
      ) : (
        <TableRow>
          <TableCell sx={{ borderBottom: 'none', textAlign: 'left', pl: 2 }}>
            <Button
              variant="text"
              startIcon={<i className="ri-add-circle-line" />}
              onClick={handleAddConciled}
            >
              Adicionar
            </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function ConciledItemRow({ item, onStartEdit, onDelete, onDesvincule, onViewDetails }) {

  const [infoAnchorEl, setInfoAnchorEl] = useState(null)

  const handleInfoClick = (event) => {
    setInfoAnchorEl(event.currentTarget)
  }

  const handleInfoClose = () => {
    setInfoAnchorEl(null)
  }

  return (
    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
      <TableCell>{typeDescription(item.type)}</TableCell>
      <TableCell colSpan={2}>{item.partner?.surname}<br />{item.category?.description}</TableCell>
      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
      <TableCell align="right">{formatCurrency(item.fee)}</TableCell>
      <TableCell align="right">{formatCurrency(item.discount)}</TableCell>
      <TableCell colSpan={2}>
        <Tooltip title='Editar'>
          <IconButton onClick={onStartEdit}>
            <i className="ri-pencil-line" />
          </IconButton>
        </Tooltip>
        <Tooltip title='Excluir'>
          <IconButton onClick={() => onDelete(item)}>
            <i className="ri-delete-bin-line" />
          </IconButton>
        </Tooltip>
      </TableCell>
      <TableCell>
        
        {(!item.paymentId && !item.receivementId && !item.receivementId) && (
          <Tooltip title='Vincular'>
            <IconButton onClick={() => onViewDetails(item.id)}>
              <i className="ri-search-line" />
            </IconButton>
          </Tooltip>
        )}

        
        
        {item.paymentId || item.receivementId && (
          <>
            <Tooltip title='Informações'>
              <IconButton onClick={handleInfoClick}>
                <i className="ri-information-line" style={{ color: '#1976d2' }} />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={infoAnchorEl}
              open={Boolean(infoAnchorEl)}
              onClose={handleInfoClose}
            >
              <MenuItem onClick={() => {
                handleInfoClose()
                onStartEdit()
              }}>
                <i className="ri-pencil-line" style={{ marginRight: 8 }} />
                Editar
              </MenuItem>
              <MenuItem onClick={() => {
                handleInfoClose()
                onDesvincule(item.id)
              }}>
                <i className="ri-link-unlink" style={{ marginRight: 8 }} />
                Desvincular
              </MenuItem>
            </Menu>
          </>
        )}
      </TableCell>
    </TableRow>
  )
}

function ConciliationForm({ statementDataId, initialValues, onFormSubmitted, onCancel }) {
  const validationSchema = Yup.object({
    type: Yup.string().required('Tipo é obrigatório'),
    partner: Yup.object().nullable().when('type', {
      is: (type) => type === 'payment' || type === 'receivement',
      then: (schema) => schema.required('Parceiro é obrigatório para Pagamento/Recebimento'),
      otherwise: (schema) => schema.nullable(),
    }),
    category: Yup.object().nullable().required('Categoria é obrigatória'),
    amount: Yup.number()
      .typeError('Valor deve ser um número')
      .required('Valor é obrigatório')
      .min(0.01, 'Valor deve ser maior que zero'),
    fee: Yup.number()
      .typeError('Taxa deve ser um número')
      .min(0, 'Taxa não pode ser negativa')
      .nullable(),
    discount: Yup.number()
      .typeError('Desconto deve ser um número')
      .min(0, 'Desconto não pode ser negativa')
      .nullable(),
  });

  const handleSubmitInternal = async (values, { setSubmitting }) => {
    setSubmitting(true);
    try {
      await saveStatementConciled(statementDataId, values);
      toast.success('Conciliação salva com sucesso!');
      onFormSubmitted();
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar a conciliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues || {
        type: '',
        partner: null,
        category: null,
        amount: '',
        fee: '',
        discount: '',
      }}
      validationSchema={validationSchema}
      enableReinitialize={true}
      onSubmit={handleSubmitInternal}
    >
      {({
        values,
        errors,
        touched,
        handleChange, // Keep handleChange for the Select due to custom logic
        handleBlur,
        handleSubmit,
        isSubmitting,
        setFieldValue,
        setFieldTouched,
      }) => (
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell sx={{ p: 1 }}>
            <Select
              fullWidth
              size="small"
              name="type"
              value={values.type}
              onChange={(e) => {
                handleChange(e); // Use handleChange here
                if (e.target.value !== 'payment' && e.target.value !== 'receivement') {
                  setFieldValue('partner', null);
                  setFieldTouched('partner', false);
                }
              }}
              onBlur={handleBlur}
              displayEmpty
              error={touched.type && Boolean(errors.type)}
            >
              <MenuItem value="">[Selecione]</MenuItem>
              <MenuItem value="payment">Pagamento</MenuItem>
              <MenuItem value="receivement">Recebimento</MenuItem>
              <MenuItem value="transfer">Transferência</MenuItem>
            </Select>
            {touched.type && errors.type && (
              <Typography variant="caption" color="error">{errors.type}</Typography>
            )}
          </TableCell>
          <TableCell sx={{ p: 1 }} colSpan={2}>
            {(values.type === 'payment' || values.type === 'receivement') && (
              <AutoComplete
                size="small"
                variant="outlined"
                placeholder="Cliente"
                value={values.partner}
                text={(partner) => partner.surname}
                onChange={(partner) => setFieldValue('partner', partner)}
                onSearch={getPartner}
                onBlur={() => setFieldTouched('partner', true)}
                error={touched.partner && Boolean(errors.partner)}
                helperText={touched.partner && errors.partner}
              >
                {(item) => <span>{item.surname}</span>}
              </AutoComplete>
            )}
            <AutoComplete
              size="small"
              variant="outlined"
              placeholder="Categoria"
              value={values.category}
              text={(category) => category.description}
              onChange={(category) => setFieldValue('category', category)}
              onSearch={getFinancialCategory}
              onBlur={() => setFieldTouched('category', true)}
              error={touched.category && Boolean(errors.category)}
              helperText={touched.category && errors.category}
            >
              {(item) => <span>{item.description}</span>}
            </AutoComplete>
          </TableCell>
          <TableCell sx={{ p: 1 }} align="right">
            <Field
              component={CurrencyField}
              size="small"
              variant="outlined"
              placeholder="Valor"
              name="amount"
              type="text"
              //error={touched.amount && Boolean(errors.amount)}
              //helperText={touched.amount && errors.amount}
            />
          </TableCell>
          <TableCell sx={{ p: 1 }} align="right">
            <Field
              component={CurrencyField}
              size="small"
              variant="outlined"
              placeholder="Taxa"
              name="fee"
              type="text"
              //error={touched.fee && Boolean(errors.fee)}
              //helperText={touched.fee && errors.fee}
            />
          </TableCell>
          <TableCell sx={{ p: 1 }} align="right">
            <Field
              component={CurrencyField}
              size="small"
              variant="outlined"
              placeholder="Desconto"
              name="discount"
              type="text"
              //error={touched.discount && Boolean(errors.discount)}
              //helperText={touched.discount && errors.discount}
            />
          </TableCell>
          <TableCell sx={{ p: 1 }} colSpan={3}>
            <Tooltip title='Confirmar'>
              <IconButton
                color="success"
                size="small"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={18} /> : <i className="ri-check-line" />}
              </IconButton>
            </Tooltip>
            <Tooltip title='Cancelar'>
              <IconButton
                color="error"
                size="small"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <i className="ri-close-line" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      )}
    </Formik>
  );
}

function EntryTypeFilterDialog({ open, onClose, allEntryTypes, selectedFilters, onFilterChange, onApplyFilter }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Tipos de lançamentos</DialogTitle>
      <DialogContent>
        {allEntryTypes?.map((type) => {
          const isChecked = selectedFilters.includes(type)
          return (
            <div key={type}>
              <label>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    onFilterChange((prev) =>
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onApplyFilter}>Aplicar</Button>
      </DialogActions>
    </Dialog>
  )
}