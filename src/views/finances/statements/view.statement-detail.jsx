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
import { AutoComplete } from '@/components/field/AutoComplete'
import { getBankAccounts, getFinancialCategory, getPartner, getUser } from '@/utils/search'
import { ViewVinculePayment } from './view.vincule-payment'
import { ViewVinculeReceivement } from './view.vincule-receivement'
import * as statements from '@/app/server/finances/statements'
import { styles } from '@/components/styles'
import { NumericField, SelectField } from '@/components/field'
import { BackdropLoading } from '@/components/BackdropLoading'

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
    case '2': return 'Pagamento';
    case '1': return 'Recebimento';
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
  const [selectedStatements, setSelectedStatements] = useState(new Set());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDrawerReceivement, setIsDrawerReceivement] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [receivementId, setReceivementId] = useState(null)

  const fetchStatement = useCallback(async (loading = true) => {
    if (statementId) {
        try {
            setLoading(loading);
            const statementData = await statements.findOne({ statementId });
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
      setSelectedStatements(new Set());
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

  const handleStatementSelectionChange = useCallback((statementId, select) => {
    setSelectedStatements(prevSelected => {
        const newSelection = new Set(prevSelected);
        if (select) {
            newSelection.add(statementId);
        } else {
            newSelection.delete(statementId);
        }
        return newSelection;
    });
  }, []);

  const toggleExpand = (idx) => {
    setExpandedRow((prev) => (prev === idx ? null : idx))
  }

  // Demais handlers (omitidos por brevidade)...
  const applyEntryTypeFilter = () => { /* ... */ };
  const handleOpenPayments = (id) => { setSelectedItemId(id); setIsDrawerOpen(true); };
  const handleClosePayments = () => { setIsDrawerOpen(false); setSelectedItemId(null); };
  const handleOpenReceivements = (id) => { setSelectedItemId(id); setIsDrawerReceivement(true); };
  const handleCloseReceivements = () => { setIsDrawerReceivement(false); setSelectedItemId(null); };
  const handleVinculePayment = async (statementDataConciledId, id) => { statements.vinculePayment({statementDataConciledId, codigo_movimento_detalhe: id}) /* ... */ };

  const handleDesvinculePayment = async (statementDataConciledId) => { /* ... */ };
  const handleOpenFilterDialog = () => { setEntryTypeFilters(statement?.entryTypes ?? []); setShowFilterDialog(true); };

  // --- NOVO: Lógica para o checkbox mestre do cabeçalho ---
  const statementDataList = statement?.statementData || [];
  const totalItems = statementDataList.length;
  
  // Calcula o número de itens selecionados, considerando a lógica em cascata
  const selectedItemsCount = statementDataList.reduce((count, data) => {
    const allConciledIds = (data.concileds || []).map(c => c.id);
    const hasChildren = allConciledIds.length > 0;
    const selectedChildrenCount = allConciledIds.filter(id => selectedConcileds.has(id)).length;
    const allChildrenSelected = hasChildren && selectedChildrenCount === allConciledIds.length;
    
    if (selectedStatements.has(data.id) || allChildrenSelected) {
      return count + 1;
    }
    return count;
  }, 0);

  // Handler para marcar/desmarcar todos os itens
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      // Seleciona todos
      const allStatementIds = statementDataList.map(d => d.id);
      const allConciledIds = statementDataList.flatMap(d => d.concileds || []).map(c => c.id);
      setSelectedStatements(new Set(allStatementIds));
      setSelectedConcileds(new Set(allConciledIds));
    } else {
      // Desseleciona todos
      setSelectedStatements(new Set());
      setSelectedConcileds(new Set());
    }
  };


  return (
    <>

      <BackdropLoading loading={loading} message={`Carregando...`} />

      <Dialog open={statementId !== undefined && !loading} onClose={onClose} fullWidth maxWidth="lg" scroll="paper" slotProps={{ paper: { sx: { position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxHeight: 'calc(100vh - 64px)' } } }} >
        <DialogTitle sx={styles.dialogTitle}> Extrato detalhado <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose} size="large"> <i className="ri-close-line" /> </IconButton> </DialogTitle>
        <DialogContent>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  {/* --- NOVO: Checkbox mestre --- */}
                  <Checkbox
                    color="primary"
                    indeterminate={selectedItemsCount > 0 && selectedItemsCount < totalItems}
                    checked={totalItems > 0 && selectedItemsCount === totalItems}
                    onChange={handleSelectAllClick}
                    disabled={totalItems === 0}
                    inputProps={{
                      'aria-label': 'select all statements',
                    }}
                  />
                </TableCell> 
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
              {statementDataList.map((data, index) => {
                
                const allConciledIdsInGroup = (data.concileds || []).map(c => c.id);
                const selectedInGroupCount = allConciledIdsInGroup.filter(id => selectedConcileds.has(id)).length;
                const hasChildren = allConciledIdsInGroup.length > 0;
                const isAllChildrenSelected = hasChildren && selectedInGroupCount === allConciledIdsInGroup.length;
                
                const isStatementSelected = selectedStatements.has(data.id) || isAllChildrenSelected;
                
                const isIndeterminate = !isStatementSelected && hasChildren && selectedInGroupCount > 0;

                const handleRowSelectAllClick = () => {
                  const newSelectState = !isStatementSelected;
                  handleStatementSelectionChange(data.id, newSelectState);
                  if (hasChildren) {
                    handleSelectionChange(allConciledIdsInGroup, newSelectState);
                  }
                };

                return (
                  <Fragment key={data.id || index}>
                    <TableRow
                      className="with-hover-actions"
                      hover
                      onDoubleClick={() => toggleExpand(index)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          indeterminate={isIndeterminate}
                          checked={isStatementSelected}
                          onChange={handleRowSelectAllClick}
                        />
                      </TableCell>
                      <TableCell style={{ width: '140px' }}>{data.sourceId}</TableCell>
                      <TableCell>{data.entryDate != null ? format(data.entryDate, 'dd/MM/yyyy HH:mm') : ""}</TableCell>
                      <TableCell>{data.reference}</TableCell>
                      <TableCell align="right">{formatCurrency(data.amount)}</TableCell>
                      <TableCell align="right">{formatCurrency(data.fee)}</TableCell>
                      <TableCell align="right"><font color='green'>{Number(data.credit) > 0 && (`+${formatCurrency(data.credit)}`)}</font></TableCell>
                      <TableCell align="right"><font color='red'>{Number(data.debit) < 0 && (`${formatCurrency(data.debit)}`)}</font></TableCell>
                      <TableCell align="right">{formatCurrency(data.balance)}</TableCell>
                      <TableCell align="left" style={{width: '80px'}}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton
                            size="small"
                            sx={{
                              p: 0,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              fontSize: '0.75rem',
                              backgroundColor: _.size(data.concileds) > 0 ? 'var(--mui-palette-primary-dark)' : '#C0C0C0',
                              color: '#fff',
                              '&:hover': {
                                backgroundColor: 'primary.dark'
                              }
                            }}
                          >
                            {_.size(data.concileds) || 0}
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(index)}
                            className={expandedRow != index ? 'row-actions' : ''}
                            sx={{
                              border: '2px solid #ccc',   // cor e espessura da borda
                              borderRadius: '50%',        // borda arredondada
                              padding: 0,                 // ajustar o padding se necessário
                              width: 32,                  // tamanho do botão
                              height: 32,                 // tamanho do botão
                            }}
                          >
                            {expandedRow === index ? (
                              <i className="ri-arrow-up-line" style={{ fontSize: 25, color: 'tomato' }} />
                            ) : (
                              <i className="ri-arrow-down-line" style={{ fontSize: 25 }} />
                            )}
                          </IconButton>
                        </Box>

                      </TableCell>

                    </TableRow>
                    
                    {expandedRow === index ? (
                      <ConciledDetailRowsGroup
                        data={data}
                        onDesvincule={handleDesvinculePayment}
                        onViewDetails={handleOpenPayments}
                        onStatementUpdate={async () => await fetchStatement(false)}
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
          <div>
            {selectedStatements.size > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<i className="ri-delete-bin-line" style={{ fontSize: 18 }} />}
                onClick={() => alert(1)}
              >
                Excluir
              </Button>
            )}
          </div>
          <div>
            <Button
              variant="text" 
              onClick={onClose} 
              startIcon={<i className="ri-link-unlink" style={{ fontSize: 18 }} />}
            >
              Desconciliar
            </Button>

            <Button
              variant="contained" 
              color="success" 
              onClick={onClose} 
              sx={{ ml: 1 }}
              startIcon={<i className="ri-check-line" style={{ fontSize: 18 }} />}
            >
              Conciliar
            </Button>
          </div>

        </DialogActions>
      </Dialog>
      
      {/* Outros componentes de Dialog e Drawer (sem alterações) */}
      <EntryTypeFilterDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        allEntryTypes={statement?.allEntryTypes || []}
        selectedFilters={entryTypeFilters}
        onFilterChange={setEntryTypeFilters}
        onApplyFilter={applyEntryTypeFilter}
      />
      <ViewVinculePayment
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

// --- CORREÇÃO DE HIDRATAÇÃO APLICADA AQUI ---
// Este componente foi reescrito para construir um array de linhas,
// evitando que espaços em branco no JSX quebrem a renderização da tabela.
function ConciledDetailRowsGroup({ data, onDesvincule, onViewDetails, onStatementUpdate, selectedConcileds, onSelectionChange }) {

  const [newConciledInputActive, setNewConciledInputActive] = useState(false)
  const [editingConciledIndex, setEditingConciledIndex] = useState(null)
  const [editingConciledData, setEditingConciledData] = useState(null)

  const handleConciliationSubmitSuccess = async () => {
    await onStatementUpdate();
    setNewConciledInputActive(false);
    setEditingConciledIndex(null);
    setEditingConciledData(null); 
  };

  const handleCancelForm = () => {
    setNewConciledInputActive(false);
    setEditingConciledIndex(null);
    setEditingConciledData(null);
  };

  const handleAddConciled = () => { setNewConciledInputActive(true); setEditingConciledIndex(null); setEditingConciledData(null); }
  const handleStartEdit = (i, item) => { setEditingConciledIndex(i); setEditingConciledData(item); setNewConciledInputActive(false); }
  const handleDeleteConciled = async (item) => { try { await deleteStatementConciled({ id: item.id }); toast.success('Registro excluído com sucesso'); handleConciliationSubmitSuccess(); } catch (error) { toast.error(error.message); } }
  
  const rows = [];

  // 1. Adiciona a linha de cabeçalho da seção de detalhes
  rows.push(
    <TableRow key="conciled-header" sx={{ backgroundColor: '#f5f5f5' }}>
      <TableCell></TableCell>
      <TableCell>Tipo</TableCell>
      <TableCell colSpan={2}>Categoria</TableCell>
      <TableCell align="right">Valor</TableCell>
      <TableCell align="right">Taxa</TableCell>
      <TableCell align="right">Desconto</TableCell>
      <TableCell colSpan={3} />
    </TableRow>
  );

  // 2. Adiciona os itens de conciliação existentes ou seus formulários de edição
  (data.concileds || []).forEach((item, i) => {
    if (editingConciledIndex === i) {
      rows.push(
        <ConciliationForm
          key={`edit-${item.id}`}
          statementDataId={data.id}
          initialValues={editingConciledData}
          isSelected={selectedConcileds.has(item.id)}
          onFormSubmitted={handleConciliationSubmitSuccess}
          onCancel={handleCancelForm}
        />
      );
    } else {
      rows.push(
        <ConciledItemRow
          key={item.id}
          item={item}
          onStartEdit={() => handleStartEdit(i, item)}
          onDelete={handleDeleteConciled}
          onDesvincule={onDesvincule}
          onViewDetails={onViewDetails}
          isSelected={selectedConcileds.has(item.id)}
          onToggleSelection={() => onSelectionChange([item.id], !selectedConcileds.has(item.id))}
        />
      );
    }
  });

  // 3. Adiciona o formulário "nova conciliação" ou o botão "Adicionar"
  if (newConciledInputActive) {
    rows.push(
      <ConciliationForm
        key="new-conciled-form"
        statementDataId={data.id}
        initialValues={{ type: '', partner: null, category: null, amount: '', fee: '', discount: '' }}
        onFormSubmitted={handleConciliationSubmitSuccess}
        onCancel={handleCancelForm}
      />
    );
  } else {
    rows.push(
      <TableRow key="add-conciled-button">
        <TableCell colSpan={11} sx={{ borderBottom: 'none', textAlign: 'left', pl: 2 }}>
          <Button variant="text" startIcon={<i className="ri-add-circle-line" />} onClick={handleAddConciled} > Adicionar </Button>
        </TableCell>
      </TableRow>
    );
  }

  // Retorna o array de linhas. O React renderizará isso corretamente.
  return rows;
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
      <TableCell colSpan={2}>
        {(item.type == '1' || item.type == '2') && (
          <>{item.partner?.surname}<br />{item.category?.description}</>
        )}
        {(item.type == 'transfer') && (
          <>{item.origin?.bank?.name} - {item.origin?.agency}<br />{item.destination?.bank?.name} - {item.destination?.agency}</>
        )}
        </TableCell>
      <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
      <TableCell align="right">{formatCurrency(item.fee)}</TableCell>
      <TableCell align="right">{formatCurrency(item.discount)}</TableCell>
      <TableCell colSpan={2}>
        <Box className="row-actions">
          <Tooltip title='Editar'><IconButton onClick={onStartEdit}><i className="ri-pencil-line" /></IconButton></Tooltip>
          <Tooltip title='Excluir'><IconButton onClick={() => onDelete(item)}><i className="ri-delete-bin-line" /></IconButton></Tooltip>
        </Box>
      </TableCell>
      <TableCell align='left'>
        <Box sx={{ display: 'flex' }}>
          {(!item.paymentId && !item.receivementId) ? (
            <>
              {/*<Tooltip title='Vincular' className="row-actions"><IconButton onClick={() => onViewDetails(item.id)}><i className="ri-search-line" /></IconButton></Tooltip>*/}
              <IconButton className="row-actions" size='small' onClick={() => onViewDetails(item.id)} sx={{p: 1}}><i className="ri-search-line" /></IconButton>
            </>
          ) : (
            <>
              <Tooltip title='Informações'><IconButton size='small' onClick={handleInfoClick} sx={{p: 1, backgroundColor: '#4ace4aff', '&:hover': { backgroundColor: 'success.dark'}, width: 24, height: 24}}><i className="ri-checkbox-circle-fill" style={{color: '#fff'}} /></IconButton></Tooltip>
              <Menu anchorEl={infoAnchorEl} open={Boolean(infoAnchorEl)} onClose={handleInfoClose} >
                {/*<MenuItem onClick={() => { handleInfoClose(); onStartEdit(); }}><i className="ri-pencil-line" style={{ marginRight: 8 }} /> Editar </MenuItem>*/}
                <MenuItem onClick={() => { handleInfoClose(); onDesvincule(item.id); }}><i className="ri-link-unlink" style={{ marginRight: 8 }} /> Desvincular </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}


function ConciliationForm({ statementDataId, isSelected, initialValues, onFormSubmitted, onCancel }) {
    const validationSchema = Yup.object({
        type: Yup.string().required(),
        partner: Yup.object().nullable().when('type', {
            is: (type) => type === 'payment' || type === 'receivement',
            then: (schema) => schema.required('Parceiro é obrigatório para Pagamento/Recebimento'),
            otherwise: (schema) => schema.nullable(),
        }),
        category: Yup.object().nullable().when('type', {
            is: (type) => type === 'payment' || type === 'receivement',
            then: (schema) => schema.required('Parceiro é obrigatório para Pagamento/Recebimento'),
            otherwise: (schema) => schema.nullable(),
        }),
        amount: Yup.number().typeError('Valor deve ser um número').required().min(0.01, 'Valor deve ser maior que zero'),
        fee: Yup.number().typeError('Taxa deve ser um número').min(0, 'Taxa não pode ser negativa').nullable(),
        discount: Yup.number().typeError('Desconto deve ser um número').min(0, 'Desconto não pode ser negativa').nullable(),
    });

    const handleSubmitInternal = async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
            await statements.saveConciled(statementDataId, values);
            //toast.success('Conciliação salva com sucesso!');
            await onFormSubmitted();
        } catch (error) {
            toast.error(error.message || 'Erro ao salvar a conciliação.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik initialValues={initialValues || { type: '', partner: null, category: null, bankAccount: null, amount: '', fee: '', discount: '' }} validationSchema={validationSchema} enableReinitialize={true} onSubmit={handleSubmitInternal} >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue, setFieldTouched }) => (
            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={isSelected}
                    disabled
                  />
                </TableCell>
                <TableCell sx={{ p: 1 }}>
                    <Select fullWidth size="small" name="type" value={values.type} onChange={(e) => { handleChange(e); if (e.target.value !== 'payment' && e.target.value !== 'receivement') { setFieldValue('partner', null); setFieldTouched('partner', false); } }} onBlur={handleBlur} displayEmpty error={touched.type && Boolean(errors.type)} sx={{backgroundColor: '#fff'}}>
                        <MenuItem value="">[Selecione]</MenuItem>
                        <MenuItem value="2">Pagamento</MenuItem>
                        <MenuItem value="1">Recebimento</MenuItem>
                        <MenuItem value="transfer">Transferência</MenuItem>
                    </Select>
                    {touched.type && errors.type && ( <Typography variant="caption" color="error">{errors.type}</Typography> )}
                </TableCell>
                <TableCell sx={{ p: 1 }} colSpan={2}>
                  
                  {(values.type === '1' || values.type === '2') && (
                    <>

                      <Field
                        variant="outlined"
                        sx={{backgroundColor: '#fff'}}
                        component={AutoComplete}
                        placeholder="Cliente"
                        name="partner"
                        text={(partner) => partner?.surname}
                        onSearch={getPartner}
                        renderSuggestion={(item) => (
                            <span>{item.surname}</span>
                        )}
                      />
                         
                      <Field
                        variant="outlined"
                        sx={{backgroundColor: '#fff'}}
                        component={AutoComplete}
                        placeholder="Categoria"
                        name="category"
                        text={(category) => category?.description || ''}
                        onSearch={(search) => getFinancialCategory(search, values.type)}
                        renderSuggestion={(item) => (
                            <span>{item.description}</span>
                        )}
                      />

                    </>
                  )}

                  {(values.type === 'transfer') && (
                    <>

                      <Field
                        variant="outlined"
                        sx={{backgroundColor: '#fff'}}
                        component={AutoComplete}
                        placeholder="Origem"
                        name="origin"
                        text={(bankAccount) => `${bankAccount.bank?.name} - ${bankAccount.agency} / ${bankAccount.number}`}
                        onSearch={getBankAccounts}
                        renderSuggestion={(bankAccount) => (
                            <span>{bankAccount.bank?.name} - {bankAccount.agency} / {bankAccount.number}</span>
                        )}
                      />

                      <Field
                        variant="outlined"
                        sx={{backgroundColor: '#fff'}}
                        component={AutoComplete}
                        placeholder="Destino"
                        name="destination"
                        text={(bankAccount) => `${bankAccount.bank?.name} - ${bankAccount.agency} / ${bankAccount.number}`}
                        onSearch={getBankAccounts}
                        renderSuggestion={(bankAccount) => (
                            <span>{bankAccount.bank?.name} - {bankAccount.agency} / {bankAccount.number}</span>
                        )}
                      />

                    </>
                  )}
                </TableCell>
                <TableCell sx={{ p: 1 }} align="right">{values.type && <Field component={NumericField} variant="outlined" placeholder="Valor" name="amount" type="text" sx={{backgroundColor: '#fff'}} />}</TableCell>
                <TableCell sx={{ p: 1 }} align="right">{values.type && <Field component={NumericField} variant="outlined" placeholder="Taxa" name="fee" type="text" sx={{backgroundColor: '#fff'}} />} </TableCell>
                <TableCell sx={{ p: 1 }} align="right">{values.type && <Field component={NumericField} variant="outlined" placeholder="Desconto" name="discount" type="text" sx={{backgroundColor: '#fff'}} />} </TableCell>
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
    return ( <Dialog open={open} onClose={onClose}><DialogTitle>Tipos de lançamentos</DialogTitle> <DialogContent> {allEntryTypes?.map((type) => { const isChecked = selectedFilters.includes(type); return ( <div key={type}> <label> <input type="checkbox" checked={isChecked} onChange={(e) => { onFilterChange((prev) => e.target.checked ? [...prev, type] : prev.filter((t) => t !== type) ) }} /> &nbsp;{entryTypeAlias[type] ? `${entryTypeAlias[type]?.content || ''} - ${entryTypeAlias[type].title}` : type} </label> </div> ) })} </DialogContent> <DialogActions> <Button onClick={onClose}>Cancelar</Button> <Button variant="contained" onClick={onApplyFilter}>Aplicar</Button> </DialogActions> </Dialog>)
}