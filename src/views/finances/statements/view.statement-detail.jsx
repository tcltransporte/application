'use client'

import {
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, Collapse, CircularProgress, Typography,
  DialogActions, Select, MenuItem, TextField, Paper, Grid, Backdrop,
  Badge,
  Tooltip,
  Menu,
  Checkbox,
  Box,
} from '@mui/material'
import { format } from 'date-fns'
import { Fragment, useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Field, Formik } from 'formik'
import * as Yup from 'yup'
import _ from 'lodash'

// --- Importações de Componentes e Funções de Serviço (VERIFIQUE ESTES CAMINHOS) ---
import { AutoComplete } from '@/components/AutoComplete'
import { getFinancialCategory, getPartner, getUser } from '@/utils/search'
import { ItemDetailDrawer } from './view.vincule-payment'
import { ViewVinculeReceivement } from './view.vincule-receivement'
import { deleteStatementConciled, desvinculePayment, getStatement, saveStatementConciled, vinculePayment } from '@/app/server/finances/statements/view.statement-detail.controller'
import { styles } from '@/components/styles'
import { NumericField } from '@/components/field'

// --- Funções Utilitárias (sem alterações) ---
const entryTypeAlias = {
  '': { title: 'Abertura e fechamento', content: 'A' },
  'payment': { title: 'Recebimento', content: 'R' },
  'shipping': { title: 'Frete', content: 'F' },
  'payout': { title: 'Transferência', content: 'T' },
  'reserve_for_payout': { title: 'Reserva para transferência', content: 'T' },
  'reserve_for_bpp_shipping_return': { title: 'Reserva para devolução', content: 'D' }
};
const formatCurrency = (value) => {
  if (value == null || isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};
const typeDescription = (raw) => {
  switch (raw) {
    case 'transfer': return 'Transferência';
    case 'payment': return 'Pagamento';
    case 'receivement': return 'Recebimento';
    default: return raw;
  }
};

export function ViewStatementDetail({ statementId, onClose, onError }) {
  const [loading, setLoading] = useState(false)
  const [statement, setStatement] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [entryTypeFilters, setEntryTypeFilters] = useState([])
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [selectedConcileds, setSelectedConcileds] = useState(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDrawerReceivement, setIsDrawerReceivement] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [receivementId, setReceivementId] = useState(null)

  const fetchStatement = useCallback(async () => {
    if (statementId) {
        try {
            setLoading(true);
            const statementData = await getStatement({ statementId });
            setOriginalData(statementData.statementData);
            const filteredData = statementData.statementData.filter((data) =>
                statementData.entryTypes?.length > 0 ? statementData.entryTypes.includes(data.entryType) : true
            );
            setStatement({
                ...statementData,
                statementData: filteredData,
                entryTypes: statementData.entryTypes ?? [],
            });
            setEntryTypeFilters(statementData.entryTypes ?? []);
        } catch (error) {
            toast.error(error.message);
            onError();
        } finally {
            setLoading(false);
        }
    }
  }, [statementId, onError]);

  useEffect(() => {
    fetchStatement()
  }, [fetchStatement]);

  useEffect(() => {
    if (!statementId) {
      setSelectedConcileds(new Set());
    }
  }, [statementId]);

  const handleSelectionChange = useCallback((conciledIds, select) => {
    setSelectedConcileds(prevSelected => {
      const newSelection = new Set(prevSelected);
      conciledIds.forEach(id => {
        if (select) {
          newSelection.add(id);
        } else {
          newSelection.delete(id);
        }
      });
      return newSelection;
    });
  }, []);

  const toggleExpand = (idx) => {
    setExpandedRow((prev) => (prev === idx ? null : idx))
  }

  // Demais handlers (handleOpenFilterDialog, etc.) permanecem inalterados...
  const applyEntryTypeFilter = () => { /* implementação omitida por brevidade */ };
  const handleOpenPayments = (id) => { setSelectedItemId(id); setIsDrawerOpen(true); };
  const handleClosePayments = () => { setIsDrawerOpen(false); setSelectedItemId(null); };
  const handleOpenReceivements = (id) => { setSelectedItemId(id); setIsDrawerReceivement(true); };
  const handleCloseReceivements = () => { setIsDrawerReceivement(false); setSelectedItemId(null); };
  const handleVinculePayment = async (statementDataConciledId, id) => { /* implementação omitida por brevidade */ };
  const handleDesvinculePayment = async (statementDataConciledId) => { /* implementação omitida por brevidade */ };
  const handleOpenFilterDialog = () => { setEntryTypeFilters(statement?.entryTypes ?? []); setShowFilterDialog(true); };


  return (
    <>
      {loading && ( <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: '#fff' }}> <CircularProgress color="inherit" /> <Typography variant="h6" sx={{ mt: 2, color: '#fff' }}>&nbsp;Carregando...</Typography> </Backdrop> )}

      <Dialog open={statementId !== undefined && !loading} onClose={onClose} fullWidth maxWidth="lg" scroll="paper" slotProps={{ paper: { sx: { position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxHeight: 'calc(100vh - 64px)' } } }} >
        <DialogTitle sx={styles.dialogTitle}> Extrato detalhado <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose} size="large"> <i className="ri-close-line" /> </IconButton> </DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" /> 
                <TableCell sx={{ width: 150 }}>ID</TableCell>
                <TableCell sx={{ width: 140 }}>Data</TableCell>
                <TableCell>Referência</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Valor</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Taxa</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Crédito</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Débito</TableCell>
                <TableCell sx={{ width: 90  }} align="right">Saldo</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(statement?.statementData || []).map((data, index) => {
                
                const allConciledIdsInGroup = (data.concileds || []).map(c => c.id);
                const selectedInGroupCount = allConciledIdsInGroup.filter(id => selectedConcileds.has(id)).length;
                const isAllSelected = allConciledIdsInGroup.length > 0 && selectedInGroupCount === allConciledIdsInGroup.length;
                const isSomeSelected = selectedInGroupCount > 0 && !isAllSelected;

                const handleRowSelectAllClick = () => {
                    handleSelectionChange(allConciledIdsInGroup, !isAllSelected);
                };

                return (
                  <Fragment key={index}>
                    <TableRow className="with-hover-actions">
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          indeterminate={isSomeSelected}
                          checked={isAllSelected}
                          onChange={handleRowSelectAllClick}
                          disabled={allConciledIdsInGroup.length === 0}
                        />
                      </TableCell>
                      <TableCell style={{ width: '140px' }}>{data.sourceId}</TableCell>
                      <TableCell>{data.entryDate != null ? format(data.entryDate, 'dd/MM/yyyy HH:mm') : ""}</TableCell>
                      <TableCell>{data.orderId ? `#${data.orderId}` : ''}</TableCell>
                      <TableCell align="right">{formatCurrency(data.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(data.fee)}</TableCell>
                      <TableCell align="right">{formatCurrency(data.credit)}</TableCell>
                      <TableCell align="right">{formatCurrency(data.debit)}</TableCell>
                      <TableCell align="right">{formatCurrency(data.balance)}</TableCell>
                      <TableCell align='right' style={{ width: '100px' }}>
                        <Badge color="primary" badgeContent={_.size(data.concileds) || "0"} sx={{ '& .MuiBadge-badge': { right: 10, fontWeight: 'bold' } }} />
                        <IconButton size='small' onClick={() => toggleExpand(index)} className="row-actions">
                          {expandedRow === index
                            ? <i className="ri-arrow-up-circle-line" style={{ fontSize: 30 }} />
                            : <i className="ri-arrow-down-circle-line" style={{ fontSize: 30 }} />
                          }
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* --- AQUI ESTÁ A CORREÇÃO --- */}
                    {expandedRow === index ? (
                      <ConciledDetailRowsGroup
                        data={data}
                        onDesvincule={handleDesvinculePayment}
                        onViewDetails={handleOpenPayments}
                        onStatementUpdate={fetchStatement}
                        selectedConcileds={selectedConcileds}
                        onSelectionChange={handleSelectionChange}
                      />
                    ) : null}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
            <IconButton onClick={handleOpenFilterDialog} size="small" > <i className="ri-filter-line" /> </IconButton>
            <div> <Button variant="text" onClick={onClose}>Desconciliar</Button> <Button variant="contained" color="success" onClick={onClose} sx={{ ml: 1 }}>Conciliar</Button> </div>
        </DialogActions>
      </Dialog>
      
      {/* Outros componentes de Dialog e Drawer */}
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
        ModalProps={{ sx: { zIndex: 99999 } }}
        onSelected={handleVinculePayment}
      />
      <ViewVinculeReceivement
        open={isDrawerReceivement}
        onClose={handleCloseReceivements}
        itemId={receivementId}
        container={document.body}
        ModalProps={{ sx: { zIndex: 99999 } }}
        onSelected={handleVinculePayment}
      />
    </>
  )
}

function ConciledDetailRowsGroup({ data, onDesvincule, onViewDetails, onStatementUpdate, selectedConcileds, onSelectionChange }) {
  const [newConciledInputActive, setNewConciledInputActive] = useState(false)
  const [editingConciledIndex, setEditingConciledIndex] = useState(null)
  const [editingConciledData, setEditingConciledData] = useState(null)

  const handleConciliationSubmitSuccess = () => { onStatementUpdate(); setNewConciledInputActive(false); setEditingConciledIndex(null); setEditingConciledData(null); };
  const handleCancelForm = () => { setNewConciledInputActive(false); setEditingConciledIndex(null); setEditingConciledData(null); };
  const handleAddConciled = () => { setNewConciledInputActive(true); setEditingConciledIndex(null); setEditingConciledData(null); }
  const handleStartEdit = (i, item) => { setEditingConciledIndex(i); setEditingConciledData(item); setNewConciledInputActive(false); }
  const handleDeleteConciled = async (item) => { try { await deleteStatementConciled({ id: item.id }); toast.success('Registro excluído com sucesso'); handleConciliationSubmitSuccess(); } catch (error) { toast.error(error.message); } }

  return (
    <>
      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
        <TableCell></TableCell>
        <TableCell>Tipo</TableCell>
        <TableCell colSpan={2}>Categoria</TableCell>
        <TableCell align="right">Valor</TableCell>
        <TableCell align="right">Taxa</TableCell>
        <TableCell align="right">Desconto</TableCell>
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
            key={item.id || i}
            item={item}
            onStartEdit={() => handleStartEdit(i, item)}
            onDelete={handleDeleteConciled}
            onDesvincule={onDesvincule}
            onViewDetails={onViewDetails}
            isSelected={selectedConcileds.has(item.id)}
            onToggleSelection={() => onSelectionChange([item.id], !selectedConcileds.has(item.id))}
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
          <TableCell colSpan={11} sx={{ borderBottom: 'none', textAlign: 'left', pl: 2 }}>
            <Button variant="text" startIcon={<i className="ri-add-circle-line" />} onClick={handleAddConciled} > Adicionar </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function ConciledItemRow({ item, onStartEdit, onDelete, onDesvincule, onViewDetails, isSelected, onToggleSelection }) {
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const handleInfoClick = (event) => setInfoAnchorEl(event.currentTarget);
  const handleInfoClose = () => setInfoAnchorEl(null);

  return (
    <TableRow sx={{ backgroundColor: '#fafafa' }} className="with-hover-actions">
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={isSelected}
          onChange={onToggleSelection}
          inputProps={{ 'aria-labelledby': `conciled-item-${item.id}` }}
        />
      </TableCell>
      <TableCell id={`conciled-item-${item.id}`}>{typeDescription(item.type)}</TableCell>
      <TableCell colSpan={2}>{item.category?.description}<br />{item.partner?.surname}</TableCell>
      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
      <TableCell align="right">{formatCurrency(item.fee)}</TableCell>
      <TableCell align="right">{formatCurrency(item.discount)}</TableCell>
      <TableCell colSpan={2}>
        <Box className="row-actions">
          <Tooltip title='Editar'><IconButton onClick={onStartEdit}><i className="ri-pencil-line" /></IconButton></Tooltip>
          <Tooltip title='Excluir'><IconButton onClick={() => onDelete(item)}><i className="ri-delete-bin-line" /></IconButton></Tooltip>
        </Box>
      </TableCell>
      <TableCell align='right'>
        {(!item.paymentId && !item.receivementId) && ( <Tooltip title='Vincular' className="row-actions"><IconButton onClick={() => onViewDetails(item.id)}><i className="ri-search-line" /></IconButton></Tooltip> )}
        {(item.paymentId || item.receivementId) && (
          <>
            <Tooltip title='Informações'><IconButton onClick={handleInfoClick}><i className="ri-edit-box-line" style={{ color: '#2e7d32' }} /></IconButton></Tooltip>
            <Menu anchorEl={infoAnchorEl} open={Boolean(infoAnchorEl)} onClose={handleInfoClose} >
              <MenuItem onClick={() => { handleInfoClose(); onStartEdit(); }}><i className="ri-pencil-line" style={{ marginRight: 8 }} /> Editar </MenuItem>
              <MenuItem onClick={() => { handleInfoClose(); onDesvincule(item.id); }}><i className="ri-link-unlink" style={{ marginRight: 8 }} /> Desvincular </MenuItem>
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
        amount: Yup.number().typeError('Valor deve ser um número').required('Valor é obrigatório').min(0.01, 'Valor deve ser maior que zero'),
        fee: Yup.number().typeError('Taxa deve ser um número').min(0, 'Taxa não pode ser negativa').nullable(),
        discount: Yup.number().typeError('Desconto deve ser um número').min(0, 'Desconto não pode ser negativa').nullable(),
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
        <Formik initialValues={initialValues || { type: '', partner: null, category: null, amount: '', fee: '', discount: '' }} validationSchema={validationSchema} enableReinitialize={true} onSubmit={handleSubmitInternal} >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue, setFieldTouched }) => (
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell /> {/* Alinha com o checkbox da linha principal */}
                <TableCell sx={{ p: 1 }}>
                    <Select fullWidth size="small" name="type" value={values.type} onChange={(e) => { handleChange(e); if (e.target.value !== 'payment' && e.target.value !== 'receivement') { setFieldValue('partner', null); setFieldTouched('partner', false); } }} onBlur={handleBlur} displayEmpty error={touched.type && Boolean(errors.type)} sx={{backgroundColor: '#fff'}}>
                        <MenuItem value="">[Selecione]</MenuItem>
                        <MenuItem value="payment">Pagamento</MenuItem>
                        <MenuItem value="receivement">Recebimento</MenuItem>
                        <MenuItem value="transfer">Transferência</MenuItem>
                    </Select>
                    {touched.type && errors.type && ( <Typography variant="caption" color="error">{errors.type}</Typography> )}
                </TableCell>
                <TableCell sx={{ p: 1 }} colSpan={2}>
                  <AutoComplete variant="outlined" placeholder="Categoria" value={values.category} text={(category) => category.description} onChange={(category) => setFieldValue('category', category)} onSearch={getFinancialCategory} onBlur={() => setFieldTouched('category', true)} error={touched.category && Boolean(errors.category)} helperText={touched.category && errors.category} sx={{backgroundColor: '#fff'}}> {(item) => <span>{item.description}</span>} </AutoComplete>
                  {(values.type === 'payment' || values.type === 'receivement') && ( <AutoComplete size="small" variant="outlined" placeholder="Cliente" value={values.partner} text={(partner) => partner.surname} onChange={(partner) => setFieldValue('partner', partner)} onSearch={getPartner} onBlur={() => setFieldTouched('partner', true)} error={touched.partner && Boolean(errors.partner)} helperText={touched.partner && errors.partner} sx={{backgroundColor: '#fff'}}> {(item) => <span>{item.surname}</span>} </AutoComplete> )}
                </TableCell>
                <TableCell sx={{ p: 1 }} align="right"> <Field as={NumericField} variant="outlined" placeholder="Valor" name="amount" type="text" sx={{backgroundColor: '#fff'}} /> </TableCell>
                <TableCell sx={{ p: 1 }} align="right"> <Field as={NumericField} variant="outlined" placeholder="Taxa" name="fee" type="text" sx={{backgroundColor: '#fff'}} /> </TableCell>
                <TableCell sx={{ p: 1 }} align="right"> <Field as={NumericField} variant="outlined" placeholder="Desconto" name="discount" type="text" sx={{backgroundColor: '#fff'}} /> </TableCell>
                <TableCell sx={{ p: 1 }} colSpan={3}>
                  <Tooltip title='Confirmar'><IconButton color="success" size="small" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={18} /> : <i className="ri-check-line" />}</IconButton></Tooltip>
                  <Tooltip title='Cancelar'><IconButton color="error" size="small" onClick={onCancel} disabled={isSubmitting}><i className="ri-close-line" /></IconButton></Tooltip>
                </TableCell>
            </TableRow>
        )}
        </Formik>
    );
}

function EntryTypeFilterDialog({ open, onClose, allEntryTypes, selectedFilters, onFilterChange, onApplyFilter }) {
    return ( <Dialog open={open} onClose={onClose}> <DialogTitle>Tipos de lançamentos</DialogTitle> <DialogContent> {allEntryTypes?.map((type) => { const isChecked = selectedFilters.includes(type); return ( <div key={type}> <label> <input type="checkbox" checked={isChecked} onChange={(e) => { onFilterChange((prev) => e.target.checked ? [...prev, type] : prev.filter((t) => t !== type) ) }} /> &nbsp;{entryTypeAlias[type] ? `${entryTypeAlias[type]?.content || ''} - ${entryTypeAlias[type].title}` : type} </label> </div> ) })} </DialogContent> <DialogActions> <Button onClick={onClose}>Cancelar</Button> <Button variant="contained" onClick={onApplyFilter}>Aplicar</Button> </DialogActions> </Dialog> )
}