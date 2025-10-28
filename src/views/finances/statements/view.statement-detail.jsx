'use client'
import {
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Collapse, CircularProgress, Typography, DialogActions, Select,
  MenuItem, TextField, Paper, Grid, Backdrop, Badge, Tooltip, Menu, Checkbox, Box,
  TablePagination,
} from '@mui/material'
import { format } from 'date-fns'
import { Fragment, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Field, Formik } from 'formik'
import * as Yup from 'yup'
import _ from 'lodash'

// --- Importações de Componentes e Funções de Serviço (VERIFIQUE ESTES CAMINHOS) ---
import { AutoComplete } from '@/components/field/AutoComplete'
import * as search from '@/utils/search'
import { ViewVinculePayment } from './view.vincule-payment'
import { ViewVinculeReceivement } from './view.vincule-receivement'
import * as statements from '@/app/server/finances/statements'
import { styles } from '@/components/styles'
import { NumericField, SelectField } from '@/components/field'
import { BackdropLoading } from '@/components/BackdropLoading'
import Swal from 'sweetalert2'

// Helpers movidos para fora do componente para não serem recriados a cada renderização
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

  // --- Estados do Componente ---
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedConcileds, setSelectedConcileds] = useState(new Set());
  const [selectedStatements, setSelectedStatements] = useState(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerReceivement, setIsDrawerReceivement] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [receivementId, setReceivementId] = useState(null);
  const [desconciling, setDesconciling] = useState(false);
  const [conciling, setConciling] = useState(false);
  const [isAddingNewStatement, setIsAddingNewStatement] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [filterTypes, setFilterTypes] = useState([]);
  const tableBodyRef = useRef(null);

  // --- Busca de Dados ---
  const fetchStatement = useCallback(async (loading = true) => {
    if (statementId) {
      try {
        setLoading(loading);
        const statementData = await statements.findOne({ statementId });
        setStatement(statementData);
      } catch (error) {
        toast.error(error.message);
        onError();
      } finally {
        setLoading(false);
      }
    }
  }, [statementId, onError]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  useEffect(() => {
    setFilterTypes([]);
    setExpandedRow(null);
    if (!statementId) {
      setSelectedConcileds(new Set());
      setSelectedStatements(new Set());
    }
  }, [statementId]);

  // --- Lógica de Pendência Centralizada ---
  const checkPendency = useCallback((data) => {

    console.log(data)

    const concileds = data.concileds ?? []

    if (concileds.length === 0) return true;

    const hasDivergent = _.some(concileds, (item) => {
        if (item.type === '1' && item.receivement) return Number(item.amount) !== Number(item.receivement?.amount);
        if (item.type === '2' && item.payment) return Number(item.amount) !== Number(item.payment?.amount);
        return false;
    });
    
    if (hasDivergent) return true;

    // --- LÓGICA DE SOMA FINAL ---
    const sumConcileds = _.sumBy(concileds, (c) => {
      const amount = Number(c.amount ?? 0);
      switch (c.type) {
        case '1': // Recebimento sempre soma
          return amount;
        case '2': // Pagamento sempre subtrai
          return amount * -1;
        case 'transfer':
          // Para transferências, o sinal depende do lançamento pai (statementData)
          if (data.credit > 0) return amount; // Se o extrato é crédito, a transferência soma
          if (data.debit < 0) return amount * -1; // Se o extrato é débito, a transferência subtrai
          return 0;
        default:
          return 0;
      }
    });

    console.log(sumConcileds.toFixed(2), data.amount)
    
    const amountMismatch = Number(sumConcileds.toFixed(2)) !== Number(data.entryAmount);

    if (amountMismatch) return true;
    
    return false;
  }, []);

  // --- Variável Principal de Dados ---
  const statementDataList = statement?.statementData || [];

  // --- Cálculos e Dados Memoizados ---
  const {
    entradas,
    saidas,
    saldoFinal,
    contasAPagar,
    contasAReceber,
    transferenciasSaldo,
    totalPendencias,
    totalItems,
    filteredDataList
  } = useMemo(() => {
    const totalItems = statementDataList.length;
    const entradas = statementDataList.filter(d => Number(d.credit) > 0).reduce((sum, d) => sum + Number(d.credit || 0), 0);
    const saidas = statementDataList.filter(d => Number(d.debit) < 0).reduce((sum, d) => sum + Math.abs(Number(d.debit || 0)), 0);
    const saldoFinal = entradas - saidas;
    const contasAPagar = statementDataList.reduce((sum, data) => sum + (data.concileds || []).filter(c => c.type === '2').reduce((s, c) => s + Number(c.amount ?? 0), 0), 0);
    const contasAReceber = statementDataList.reduce((sum, data) => sum + (data.concileds || []).filter(c => c.type === '1').reduce((s, c) => s + Number(c.amount ?? 0), 0), 0);
    const allConcileds = statementDataList.flatMap(d => d.concileds || []);
    const totalTransferenciasEntrada = _.sumBy(allConcileds.filter(c => c.type === 'transfer' && c.credit > 0), 'amount');
    const totalTransferenciasSaida = _.sumBy(allConcileds.filter(c => c.type === 'transfer' && c.debit < 0), 'amount');
    const transferenciasSaldo = totalTransferenciasEntrada - totalTransferenciasSaida;
    const totalPendencias = statementDataList.filter(data => checkPendency(data)).length;

    const filteredDataList = statementDataList.filter(data => {
        if (filterTypes.length === 0) return true;
        return filterTypes.some(ft => {
            switch (ft) {
                case 'entrada': return data.credit > 0;
                case 'saida': return data.debit < 0;
                case 'receber': return (data.concileds || []).some(c => c.type === '1');
                case 'pagar': return (data.concileds || []).some(c => c.type === '2');
                case 'transferencia': return (data.concileds || []).some(c => c.type === 'transfer');
                case 'pendencia': return checkPendency(data);
                default: return true;
            }
        });
    });

    return { entradas, saidas, saldoFinal, contasAPagar, contasAReceber, transferenciasSaldo, totalPendencias, totalItems, filteredDataList };
  }, [statementDataList, filterTypes, checkPendency]);

  // --- Handlers de Interação ---
  const handleStartAddStatement = (e) => {
    Swal.fire({ icon: `warning`, title: `Ops`, text: `Sem permissão para adicionar!`, confirmButtonText: `Ok` });
  };

  const handleFinishAddStatement = async () => {
    setIsAddingNewStatement(false);
    await fetchStatement(false);
  };

  const handleSelectionChange = useCallback((conciledIds, select) => {
    setSelectedConcileds(prevSelected => {
      const newSelection = new Set(prevSelected);
      conciledIds.forEach(id => select ? newSelection.add(id) : newSelection.delete(id));
      return newSelection;
    });
  }, []);

  const handleStatementSelectionChange = useCallback((statementId, select) => {
    setSelectedStatements(prevSelected => {
      const newSelection = new Set(prevSelected);
      select ? newSelection.add(statementId) : newSelection.delete(statementId);
      return newSelection;
    });
  }, []);
  
  const handleOpenPayments = (id) => { setSelectedItemId(id); setIsDrawerOpen(true); };
  const handleClosePayments = () => { setIsDrawerOpen(false); setSelectedItemId(null); };
  const handleOpenReceivements = (id) => { setReceivementId(id); setIsDrawerReceivement(true); };
  const handleCloseReceivements = () => { setIsDrawerReceivement(false); setReceivementId(null); };

  const handleViewDetails = (conciledItem) => {
    if (!conciledItem) return;
    switch(conciledItem.type) {
        case '1': handleOpenReceivements(conciledItem.id); break;
        case '2': handleOpenPayments(conciledItem.id); break;
    }
  };

  const handleVinculePayment = async (statementDataConciledId, id) => {
    await statements.vinculePayment({ statementDataConciledId, codigo_movimento_detalhe: id });
    await fetchStatement(false);
    handleClosePayments();
  };

  const handleVinculeReceivement = async (statementDataConciledId, id) => {
    await statements.vinculeReceivement({ statementDataConciledId, codigo_movimento_detalhe: id });
    await fetchStatement(false);
    handleCloseReceivements();
  };

  const handleDesvincule = async (statementDataConciledId) => {
    await statements.desvincule({ statementDataConciledId });
    await fetchStatement(false);
    handleCloseReceivements();
  };
  
  const selectedItemsCount = statementDataList.reduce((count, data) => {
    const allConciledIds = (data.concileds || []).map(c => c.id);
    const selectedChildrenCount = allConciledIds.filter(id => selectedConcileds.has(id)).length;
    if (selectedStatements.has(data.id) || (allConciledIds.length > 0 && selectedChildrenCount === allConciledIds.length)) {
      return count + 1;
    }
    return count;
  }, 0);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const allStatementIds = statementDataList.map(d => d.id);
      const allConciledIds = statementDataList.flatMap(d => d.concileds || []).map(c => c.id);
      setSelectedStatements(new Set(allStatementIds));
      setSelectedConcileds(new Set(allConciledIds));
    } else {
      setSelectedStatements(new Set());
      setSelectedConcileds(new Set());
    }
  };

  // Paginação
  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Dados da página atual
  const paginatedData = filteredDataList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <BackdropLoading loading={loading} message={'Carregando...'} />
      <Dialog open={statementId !== undefined && !loading} onClose={onClose} fullWidth maxWidth="lg" scroll="paper"
        slotProps={{ paper: { sx: { position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxHeight: 'calc(100vh - 64px)' } } }}
      >
        <DialogTitle sx={styles.dialogTitle}>
          Extrato detalhado
          <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose} size="large">
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent>

        <Box sx={{ mb: 2, mt: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {[
              { label: "Entradas", value: `R$ ${formatCurrency(entradas)}`, icon: "ri-arrow-down-circle-line", type: "entrada" },
              { label: "Saídas", value: `R$ ${formatCurrency(saidas)}`, icon: "ri-arrow-up-circle-line", type: "saida" },
              { label: "Saldo do dia", value: `R$ ${formatCurrency(saldoFinal)}`, icon: "ri-wallet-3-line", type: "saldo" },
              { label: "Contas a pagar", value: `R$ ${formatCurrency(contasAPagar)}`, icon: "ri-bill-line", type: "pagar" },
              { label: "Contas a receber", value: `R$ ${formatCurrency(contasAReceber)}`, icon: "ri-money-dollar-circle-line", type: "receber" },
              { label: "Transferências", value: `R$ ${formatCurrency(transferenciasSaldo)}`, icon: "ri-arrow-left-right-line", type: "transferencia" },
              { label: "Pendência", value: totalPendencias, icon: "ri-bar-chart-line", type: "pendencia" },
            ].map((item, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 2,
                  textAlign: "center",
                  borderRadius: 2,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": { bgcolor: "grey.100" },
                  border: "1px solid #ccc",
                  outline: filterTypes.includes(item.type) ? "3px solid" : "none",
                  outlineColor: filterTypes.includes(item.type) ? "primary.main" : "none",
                  position: "relative",
                }}
                onClick={() => {
                  setFilterTypes(prev =>
                    prev.includes(item.type)
                      ? prev.filter(t => t !== item.type)
                      : [...prev, item.type]
                  );
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <i className={item.icon} style={{ fontSize: 22, color: "#1976d2" }} />
                  <Typography variant="body2" fontWeight="medium">{item.label}</Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold">{item.value}</Typography>
                <i
                  className="ri-filter-line"
                  style={{
                    visibility: filterTypes.includes(item.type) ? 'visible' : 'hidden',
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    fontSize: 18,
                    color: '#1976d2'
                  }}
                />
              </Paper>
            ))}
          </Box>
        </Box>

          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selectedItemsCount > 0 && selectedItemsCount < totalItems}
                    checked={totalItems > 0 && selectedItemsCount === totalItems}
                    onChange={handleSelectAllClick}
                    disabled={totalItems === 0}
                  />
                </TableCell>
                <TableCell sx={{ width: 160 }}>Data</TableCell>
                <TableCell sx={{ width: 140 }}>ID</TableCell>
                <TableCell>Referência</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Total</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Taxa</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Valor</TableCell>
                <TableCell sx={{ width: 110 }} align="right">Saldo</TableCell>
                <TableCell sx={{ width: 90 }} />
              </TableRow>
            </TableHead>
            <TableBody ref={tableBodyRef}>
              {paginatedData.map((data, index) => {

                const hasError = _.size(_.filter(data.concileds, (item) => item.message != null)) >= 1;

                const allConcileds = (data.concileds?.length > 0 && data.concileds.every(c => c.isConciled));
                const showAlert = checkPendency(data);
                const rowColor = hasError ? 'red' : (allConcileds ? '#155724' : 'inherit');

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
                    {editingRowIndex !== index && (
                      <TableRow hover
                        sx={{
                          "& .actions-container": { display: 'flex', alignItems: 'center', gap: 2 },
                          "& .concileds": { display: 'block' },
                          "& .edit": { display: 'none' },
                          "&:hover .concileds": { display: 'none' },
                          "&:hover .edit": { display: 'inline-flex' },
                          "& .expand": { visibility: 'hidden' },
                          "&:hover .expand": { visibility: 'visible' },
                        }}
                      >
                        <TableCell padding="checkbox">
                           <Checkbox
                                color="primary"
                                indeterminate={isIndeterminate}
                                checked={isStatementSelected}
                                onChange={handleRowSelectAllClick}
                            />
                        </TableCell>
                        <TableCell><Typography fontSize={12} color={rowColor}>{data.entryDate ? format(new Date(data.entryDate), 'dd/MM/yyyy HH:mm') : ""}</Typography></TableCell>
                        <TableCell>
                          <Tooltip title={data.description} placement="right">
                            <Typography fontSize={12} color={rowColor}>{data.sourceId}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell><Typography fontSize={12} color={rowColor}>{data.reference}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={12} color={rowColor}>{formatCurrency(data.amount)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={12} color={rowColor}>{formatCurrency(data.fee)}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography fontSize={12} color='green'>{Number(data.credit) > 0 && `+${formatCurrency(data.credit)}`}</Typography>
                          <Typography fontSize={12} color='red'>{Number(data.debit) < 0 && formatCurrency(data.debit)}</Typography>
                        </TableCell>
                        {/*<TableCell align="right"><Typography fontSize={12} color='red'>{Number(data.debit) < 0 && formatCurrency(data.debit)}</Typography></TableCell>*/}
                        <TableCell align="right"><Typography fontSize={12} color={rowColor}>{formatCurrency(data.balance)}</Typography></TableCell>
                        <TableCell align="left" sx={{ width: 80 }}>
                          <Box className="actions-container">
                            <IconButton className="concileds" sx={{ p: 0, width: 24, height: 24, borderRadius: '50%', fontSize: 12, backgroundColor: _.size(data.concileds) > 0 ? 'var(--mui-palette-primary-dark)' : '#C0C0C0', color: '#fff', '&:hover': { backgroundColor: 'primary.dark' }, position: 'relative' }}>
                              {_.size(data.concileds) || 0}
                              {showAlert && (
                                <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--mui-palette-error-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, animation: 'pulse 1s infinite', '@keyframes pulse': { '50%': { transform: 'scale(1.2)' }, }, }}>
                                  <i className="ri-error-warning-fill" style={{ fontSize: 10 }} />
                                </Box>
                              )}
                            </IconButton>
                            <Tooltip title='Editar'>
                              <IconButton className="edit" sx={{ p: 0, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#f57c00', color: '#fff', '&:hover': { backgroundColor: 'primary.dark' }}} onClick={(e) => { Swal.fire({ icon: `warning`, title: `Ops`, text: `Sem permissão para editar!`, confirmButtonText: `Ok` })}}>
                                <i className="ri-pencil-line" style={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <IconButton className="expand" size="small" onClick={(e) => { e.stopPropagation(); setExpandedRow((prev) => (prev === index ? null : index)) }} sx={{ border: '2px solid #ccc', borderRadius: '50%', p: 0, width: 32, height: 32, color: expandedRow === index ? 'tomato' : 'inherit' }}>
                                {expandedRow === index ? <i className="ri-arrow-up-line" style={{ fontSize: 25 }} /> : <i className="ri-arrow-down-line" style={{ fontSize: 25 }} />}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}

                    {editingRowIndex === index && (
                      <StatementDataForm initialValues={data} onCancel={() => setEditingRowIndex(null)} onFormSubmitted={async () => { await fetchStatement(false); setEditingRowIndex(null); }} />
                    )}
                    
                    {expandedRow === index && (
                      <ConciledDetailRowsGroup
                        data={{ ...data, concileds: (data.concileds || []).filter(c => {
                            if (filterTypes.length === 0) return true;
                            // ... Lógica de filtro para expandidos ...
                            return true;
                        })}}
                        onDesvincule={handleDesvincule}
                        onViewDetails={handleViewDetails}
                        onStatementUpdate={async () => await fetchStatement(false)}
                        selectedConcileds={selectedConcileds}
                        onSelectionChange={handleSelectionChange}
                      />
                    )}
                  </Fragment>
                )
              })}
              <TableRow key="add-statement-row">
                <TableCell colSpan={11} sx={{ borderBottom: "none", p: 1 }}>
                  {isAddingNewStatement ? (
                    <StatementDataForm onFormSubmitted={async () => { await handleFinishAddStatement(); }} onCancel={() => setIsAddingNewStatement(false)} />
                  ) : (
                    <Button type="button" variant="text" startIcon={<i className="ri-add-circle-line" />} onClick={handleStartAddStatement}>Adicionar lançamento</Button>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Paginação */}
          <TablePagination
            component="div"
            count={filteredDataList.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
          />
          
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <div>
            {selectedStatements.size > 0 ? (
              <Button variant="outlined" color="error" startIcon={<i className="ri-delete-bin-line" style={{ fontSize: 18 }} />} onClick={async () => { Swal.fire({ icon: `warning`, title: `Ops`, text: `Sem permissão para excluir!`, confirmButtonText: `Ok` }) }}>Excluir</Button>
            ) : ( <></> )}
          </div>
          <div>
            {selectedConcileds.size > 0 && (
              <>
                <Button variant="text" onClick={async () => { try { setDesconciling(true); await statements.desconcile({id: Array.from(selectedConcileds)}); await fetchStatement(false); toast.success('Desconciliado com sucesso!'); } catch (error) { console.log(error); } finally { setDesconciling(false); } }} startIcon={<i className="ri-link-unlink" style={{ fontSize: 18 }} />} disabled={desconciling}>{desconciling ? 'Desconciliando' : 'Desconciliar'}</Button>
                <Button variant="contained" color="success" onClick={async () => { try { setConciling(true); await statements.concile({id: Array.from(selectedConcileds)}); await fetchStatement(false); toast.success('Conciliado com sucesso!'); } catch (error) { console.log(error); } finally { setConciling(false); } }} sx={{ ml: 1 }} startIcon={<i className="ri-check-line" style={{ fontSize: 18 }} />} disabled={conciling}>{conciling ? 'Conciliando' : 'Conciliar'}</Button>
              </>
            )}
          </div>
        </DialogActions>
      </Dialog>
      <ViewVinculePayment open={isDrawerOpen} onClose={handleClosePayments} itemId={selectedItemId} onSelected={handleVinculePayment} />
      <ViewVinculeReceivement open={isDrawerReceivement} onClose={handleCloseReceivements} itemId={receivementId} onSelected={handleVinculeReceivement} />
    </>
  )
}


// As sub-componentes (formulários, etc.) permanecem aqui, no mesmo arquivo.
// Elas já estavam bem estruturadas.

function StatementDataForm({ initialValues, onFormSubmitted, onCancel }) {
    const validationSchema = Yup.object({
        reference: Yup.string().required("Referência obrigatória"),
        amount: Yup.number().typeError("Valor inválido").required("Obrigatório"),
        entryDate: Yup.date().typeError("Data inválida").required("Obrigatória"),
    });

    const handleSubmitInternal = async (values, { setSubmitting }) => {
        try {
            // await statements.saveStatementData(values); // 🔹 você implementa no service (igual saveConciled)
            await onFormSubmitted();
        } catch (error) {
            toast.error(error.message || "Erro ao salvar statementData");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={initialValues || { reference: "", amount: "", entryDate: new Date(), fee: 0, credit: 0, debit: 0 }}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmitInternal}
        >
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                    <TableCell sx={{ width: 150 }} colSpan={2}>
                        <TextField fullWidth size="small" name="sourceId" value={values.sourceId} onChange={handleChange} />
                    </TableCell>
                    <TableCell sx={{ width: 140 }}>
                        <TextField fullWidth size="small" type="datetime-local" name="entryDate" value={format(new Date(values.entryDate), "yyyy-MM-dd'T'HH:mm")} onChange={handleChange} />
                    </TableCell>
                    <TableCell>
                        <TextField fullWidth size="small" name="reference" value={values.reference} onChange={handleChange} />
                    </TableCell>
                    <TableCell align="right">
                        <TextField fullWidth size="small" type="number" name="amount" value={values.amount} onChange={handleChange} />
                    </TableCell>
                    <TableCell align="right">
                        <TextField fullWidth size="small" type="number" name="fee" value={values.fee} onChange={handleChange} />
                    </TableCell>
                    <TableCell align="right">
                        <TextField fullWidth size="small" type="number" name="credit" value={values.credit} onChange={handleChange} />
                    </TableCell>
                    <TableCell align="right">
                        <TextField fullWidth size="small" type="number" name="debit" value={values.debit} onChange={handleChange} />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(values.balance || 0)}</TableCell>
                    <TableCell align="left">
                        <Tooltip title="Confirmar">
                            <IconButton color="success" size="small" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={18} /> : <i className="ri-check-line" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                            <IconButton color="error" size="small" onClick={onCancel}>
                                <i className="ri-close-line" />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                </TableRow>
            )}
        </Formik>

    );
}

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
    const handleAddConciled = () => {
        setNewConciledInputActive(true);
        setEditingConciledIndex(null);
        setEditingConciledData(null);
    }
    const handleStartEdit = (i, item) => {
        setEditingConciledIndex(i);
        setEditingConciledData(item);
        setNewConciledInputActive(false);
    }
    const handleDeleteConciled = async (item) => {
        try {
            await statements.deleteConciled({ id: item.id });
            toast.success('Registro excluído com sucesso');
            handleConciliationSubmitSuccess();
        } catch (error) {
            toast.error(error.message);
        }
    }

    const rows = [];
    rows.push(
        <TableRow key="conciled-header" sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell></TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell colSpan={2}>Categoria</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Taxa</TableCell>
            <TableCell align="right">Desconto</TableCell>
            <TableCell colSpan={2} />
        </TableRow>
    );

    (data.concileds || []).forEach((item, i) => {
        if (editingConciledIndex === i) {
            rows.push(
                <ConciliationForm
                    key={`edit-${item.id}`}
                    statementData={data}
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

    if (newConciledInputActive) {
        rows.push(
            <ConciliationForm
                key="new-conciled-form"
                statementDataId={data.id}
                initialValues={{ type: '', partner: null, category: null, amount: 0, fee: 0, discount: 0 }}
                onFormSubmitted={handleConciliationSubmitSuccess}
                onCancel={handleCancelForm}
            />
        );
    } else {
        rows.push(
            <TableRow key="add-conciled-button">
                <TableCell colSpan={11} sx={{ borderBottom: 'none', textAlign: 'left', pl: 2 }}>
                    <Button variant="text" startIcon={<i className="ri-add-circle-line" />} onClick={handleAddConciled}>
                        Adicionar
                    </Button>
                </TableCell>
            </TableRow>
        );
    }

    return rows;
}

function ConciledItemRow({ item, onStartEdit, onDelete, onDesvincule, onViewDetails, isSelected, onToggleSelection }) {
    const [infoAnchorEl, setInfoAnchorEl] = useState(null);
    const handleInfoClick = (event) => setInfoAnchorEl(event.currentTarget);
    const handleInfoClose = () => setInfoAnchorEl(null);

    const rowColor = item.isConciled ? '#155724' : item.message != null ? 'red' : 'inherit'
    let isDivergent = (item.payment && item.amount != item.payment.amount) || (item.receivement && item.amount != item.receivement.amount);

    return (
        <TableRow sx={{ backgroundColor: '#fafafa', cursor: 'pointer' }} className="with-hover-actions" onDoubleClick={onStartEdit}>
            <TableCell padding="checkbox">
                <Checkbox color="primary" checked={isSelected} onChange={onToggleSelection} inputProps={{ 'aria-labelledby': `conciled-item-${item.id}` }} />
            </TableCell>
            <TableCell id={`conciled-item-${item.id}`}><Typography color={rowColor} fontSize={12}>{typeDescription(item.type)}</Typography></TableCell>
            <TableCell colSpan={2}>
                <Typography color={rowColor} fontSize={12}>
                    {(item.type === '1' || item.type === '2') && (<>{item.partner?.surname}<br />{item.category?.description}</>)}
                    {item.type === 'transfer' && (<><b>Origem:</b> {item.origin?.name}{item.origin?.agency && item.origin?.number ? ` - ${item.origin.agency} / ${item.origin.number}` : ""}<br /><b>Destino:</b> {item.destination?.name}{item.destination?.agency && item.destination?.number ? ` - ${item.destination.agency} / ${item.destination.number}` : ""}</>)}
                </Typography>
            </TableCell>
            <TableCell align="right"><Typography color={rowColor} fontSize={12}>{formatCurrency(item.amount)}</Typography></TableCell>
            <TableCell align="right"><Typography color={rowColor} fontSize={12}>{formatCurrency(item.fee)}</Typography></TableCell>
            <TableCell align="right"><Typography color={rowColor} fontSize={12}>{formatCurrency(item.discount)}</Typography></TableCell>
            <TableCell colSpan={1}>
                {!item.isConciled && (<Box className="row-actions"><Tooltip title='Editar'><IconButton onClick={onStartEdit}><i className="ri-pencil-line" /></IconButton></Tooltip><Tooltip title='Excluir'><IconButton onClick={() => onDelete(item)}><i className="ri-delete-bin-line" /></IconButton></Tooltip></Box>)}
            </TableCell>
            <TableCell align='left'>
                <Box sx={{ display: 'flex' }}>
                    {!item.isConciled && (<>
                        {(!item.paymentId && !item.receivementId) ? (
                            <IconButton className="row-actions" size='small' onClick={() => onViewDetails(item)} sx={{ p: 1 }}><i className="ri-search-line" /></IconButton>
                        ) : (
                            <>
                                <Tooltip title={<><Typography fontSize={18} color='white'>Conta a {item.paymentId ? 'pagar' : 'receber'}</Typography><ul style={{ paddingLeft: '18px' }}><li>Cliente: {item.receivement?.financialMovement?.partner?.surname || item.payment?.financialMovement?.partner?.surname}</li><li>Valor: {item.receivement?.amount || item.payment?.amount}</li><li>Observação: {item.receivement?.observation || item.payment?.observation}</li></ul></>} placement="left" slotProps={{ tooltip: { sx: { width: 900, maxWidth: 'unset', fontSize: 13, }, }, }}>
                                    <IconButton size="small" onClick={handleInfoClick} sx={{ p: 1, backgroundColor: '#4ace4aff', '&:hover': { backgroundColor: 'success.dark' }, width: 24, height: 24 }}>
                                        <i className="ri-checkbox-circle-fill" style={{ color: '#fff' }} />
                                        {isDivergent && (<Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--mui-palette-error-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, animation: 'pulse 1s infinite', '@keyframes pulse': { '50%': { transform: 'scale(1.2)' }, }, }}><i className="ri-error-warning-fill" style={{ fontSize: 10 }} /></Box>)}
                                    </IconButton>
                                </Tooltip>
                                <Menu anchorEl={infoAnchorEl} open={Boolean(infoAnchorEl)} onClose={handleInfoClose}>
                                    <MenuItem onClick={() => { handleInfoClose(); onDesvincule(item.id); }}><i className="ri-link-unlink" style={{ marginRight: 8 }} /> Desvincular</MenuItem>
                                    {item.receivement?.financialMovement?.externalId && (<MenuItem onClick={() => { handleInfoClose(); window.open(`https://erp.tiny.com.br/contas_receber#edit/${item.receivement?.financialMovement?.externalId}`, "_blank", "noopener,noreferrer") }}><i className="ri-external-link-line" style={{ marginRight: 8 }} /> Abrir link externo</MenuItem>)}
                                    {item.payment?.financialMovement?.externalId && (<MenuItem onClick={() => { handleInfoClose(); window.open(`https://erp.tiny.com.br/contas_pagar#edit/${item.payment?.financialMovement?.externalId}`, "_blank", "noopener,noreferrer") }}><i className="ri-external-link-line" style={{ marginRight: 8 }} /> Abrir link externo</MenuItem>)}
                                </Menu>
                            </>
                        )}
                    </>)}
                    {item.message != null && (<Tooltip title={item.message}><IconButton size='small' sx={{ p: 1, backgroundColor: 'red', '&:hover': { backgroundColor: 'red' }, width: 24, height: 24 }}><i className="ri-close-circle-fill" style={{ color: '#fff' }} /></IconButton></Tooltip>)}
                </Box>
            </TableCell>
        </TableRow>
    )
}

function ConciliationForm({ statementData, statementDataId, isSelected, initialValues, onFormSubmitted, onCancel }) {
    const validationSchema = Yup.object({});

    const handleSubmitInternal = async (values, { setSubmitting }) => {
        setSubmitting(true);
        try {
            await statements.saveConciled(statementDataId, values);
            await onFormSubmitted();
        } catch (error) {
            toast.error(error.message || 'Erro ao salvar a conciliação.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Formik
            initialValues={initialValues || { type: '', partner: null, category: null, amount: '', fee: '', discount: '' }}
            validationSchema={validationSchema}
            enableReinitialize={true}
            onSubmit={handleSubmitInternal}
        >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue, setFieldTouched }) => (
                <TableRow sx={{ backgroundColor: '#fafafa' }}>
                    <TableCell padding="checkbox"><Checkbox color="primary" checked={isSelected} disabled /></TableCell>
                    <TableCell sx={{ p: 1 }}>
                        <Select fullWidth size="small" name="type" value={values.type} onChange={(e) => { handleChange(e); if (e.target.value !== 'payment' && e.target.value !== 'receivement') { setFieldValue('partner', null); setFieldTouched('partner', false); } }} onBlur={handleBlur} displayEmpty error={touched.type && Boolean(errors.type)} sx={{ backgroundColor: '#fff' }}>
                            <MenuItem value="">[Selecione]</MenuItem>
                            <MenuItem value="2">Pagamento</MenuItem>
                            <MenuItem value="1">Recebimento</MenuItem>
                            <MenuItem value="transfer">Transferência</MenuItem>
                        </Select>
                        {touched.type && errors.type && (<Typography variant="caption" color="error">{errors.type}</Typography>)}
                    </TableCell>
                    <TableCell sx={{ p: 1 }} colSpan={2}>
                        {(values.type === '1' || values.type === '2') && (<>
                            <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Cliente" name="partner" text={(partner) => partner?.surname} onSearch={search.partner} renderSuggestion={(item) => (<span>{item.surname}</span>)} />
                            <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Categoria" name="category" text={(category) => category?.description || ''} onSearch={(value) => search.financialCategory(value)} renderSuggestion={(item) => (<span>{item.description}</span>)} />
                        </>)}
                        {(values.type === 'transfer') && (<>
                            <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Origem" name="origin" text={(b) => b ? `${b.name}${b.agency ? ` - ${b.agency}` : ''}${b.number ? ` / ${b.number}` : ''}` : ''} onSearch={search.bankAccount} renderSuggestion={(b) => <span>{b ? `${b.name}${b.agency ? ` - ${b.agency}` : ''}${b.number ? ` / ${b.number}` : ''}` : ''}</span>} />
                            <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Destino" name="destination" text={(b) => b ? `${b.name}${b.agency ? ` - ${b.agency}` : ''}${b.number ? ` / ${b.number}` : ''}` : ''} onSearch={search.bankAccount} renderSuggestion={(b) => <span>{b ? `${b.name}${b.agency ? ` - ${b.agency}` : ''}${b.number ? ` / ${b.number}` : ''}` : ''}</span>} />
                        </>)}
                    </TableCell>
                    <TableCell sx={{ p: 1 }} align="right">{values.type && <Field component={NumericField} variant="outlined" placeholder="Valor" name="amount" type="text" sx={{ backgroundColor: '#fff' }} />}</TableCell>
                    <TableCell sx={{ p: 1 }} align="right">{values.type && <Field component={NumericField} variant="outlined" placeholder="Taxa" name="fee" type="text" sx={{ backgroundColor: '#fff' }} />} </TableCell>
                    <TableCell sx={{ p: 1 }} align="right">{values.type && <Field component={NumericField} variant="outlined" placeholder="Desconto" name="discount" type="text" sx={{ backgroundColor: '#fff' }} />} </TableCell>
                    <TableCell sx={{ p: 1 }} colSpan={3}>
                        <Tooltip title='Confirmar'><IconButton color="success" size="small" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={18} /> : <i className="ri-check-line" />}</IconButton></Tooltip>
                        <Tooltip title='Cancelar'><IconButton color="error" size="small" onClick={onCancel} disabled={isSubmitting}><i className="ri-close-line" /></IconButton></Tooltip>
                    </TableCell>
                </TableRow>
            )}
        </Formik>
    );
}