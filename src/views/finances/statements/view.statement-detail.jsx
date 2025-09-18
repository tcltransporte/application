'use client'
import {
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Button, Collapse, CircularProgress, Typography, DialogActions, Select,
  MenuItem, TextField, Paper, Grid, Backdrop, Badge, Tooltip, Menu, Checkbox, Box,
} from '@mui/material'
import { format } from 'date-fns'
import { Fragment, useEffect, useState, useCallback, useRef } from 'react'
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
import Swal from 'sweetalert2'

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
  const [expandedRow, setExpandedRow] = useState(null)
  const [selectedConcileds, setSelectedConcileds] = useState(new Set());
  const [selectedStatements, setSelectedStatements] = useState(new Set());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDrawerReceivement, setIsDrawerReceivement] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [receivementId, setReceivementId] = useState(null)

  const [desconciling, setDesconciling] = useState(false)
  const [conciling, setConciling] = useState(false)

  const [isAddingNewStatement, setIsAddingNewStatement] = useState(false)
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  // ref para o container do body da tabela (usado para restaurar scroll se necessário)
  const tableBodyRef = useRef(null);

  const handleStartAddStatement = (e) => {

    Swal.fire({
      icon: `warning`,
      title: `Ops`,
      text: `Sem permissão para adicionar!`,
      confirmButtonText: `Ok`
    })

    return

    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    // salva scroll atual
    const tableBody = tableBodyRef.current;
    const prevScrollTop = tableBody?.scrollTop ?? 0;

    setIsAddingNewStatement(true);

    // restaura no próximo tick (fallback)
    setTimeout(() => {
      if (tableBody) tableBody.scrollTop = prevScrollTop;
    }, 0);
  };

  const handleFinishAddStatement = async () => {
    setIsAddingNewStatement(false);
    await fetchStatement(false);
    // restaura scroll após atualização
    setTimeout(() => {
      const tableBody = tableBodyRef.current;
      if (tableBody) tableBody.scrollTop = tableBody.scrollTop; // noop para garantir repaint
    }, 0);
  };

  const fetchStatement = useCallback(async (loading = true) => {
    if (statementId) {
      try {
        setLoading(loading);
        const statementData = await statements.findOne({ statementId });

        const filteredData = statementData.statementData.filter((data) =>
          statementData.entryTypes?.length > 0 ? statementData.entryTypes.includes(data.entryType) : true
        );
        setStatement({
          ...statementData,
          statementData: filteredData,
          entryTypes: statementData.entryTypes ?? [],
        });
        
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

  const handleOpenPayments = (id) => {
    setSelectedItemId(id);
    setIsDrawerOpen(true);
  };

  const handleClosePayments = () => {
    setIsDrawerOpen(false);
    setSelectedItemId(null);
  };

  const handleOpenReceivements = (id) => {
    setReceivementId(id);
    setIsDrawerReceivement(true);
  }

  const handleCloseReceivements = () => {
    setIsDrawerReceivement(false);
    setReceivementId(null);
  }
  
  const handleViewDetails = (conciledItem) => {

    if (!conciledItem) return

    switch(conciledItem.type) {
      case '1':
        handleOpenReceivements(conciledItem.id)
        break;
      case '2':
        handleOpenPayments(conciledItem.id)
        break;
    }

  }

  const handleVinculePayment = async (statementDataConciledId, id) => {
    statements.vinculePayment({ statementDataConciledId, codigo_movimento_detalhe: id })
    await fetchStatement(false)
    handleClosePayments()
  }

  const handleVinculeReceivement = async (statementDataConciledId, id) => {
    statements.vinculeReceivement({ statementDataConciledId, codigo_movimento_detalhe: id })
    await fetchStatement(false)
    handleCloseReceivements()
  }

  const handleDesvincule = async (statementDataConciledId) => {
    statements.desvincule({ statementDataConciledId })
    await fetchStatement(false)
    handleCloseReceivements()
  }

  const [filterTypes, setFilterTypes] = useState([]); // múltiplos filtros

  const statementDataList = statement?.statementData || [];
  const totalItems = statementDataList.length;

  // ---- totais ----
  const entradas = statementDataList
    .filter(d => Number(d.credit) > 0)
    .reduce((sum, d) => sum + Number(d.credit || 0), 0);

  const saidas = statementDataList
    .filter(d => Number(d.debit) < 0)               // pega débitos negativos
    .reduce((sum, d) => sum + Math.abs(Number(d.debit || 0)), 0); // soma como positivo

  // Dentro do seu componente, antes do return
  const contasAReceber = statementDataList.reduce((sum, data) => {
    const total = (data.concileds || [])
      .filter(c => c.type === '1')
      .reduce((s, c) => s + Number(c.amount ?? 0), 0);
    return sum + total;
  }, 0);

  const contasAPagar = statementDataList.reduce((sum, data) => {
    const total = (data.concileds || [])
      .filter(c => c.type === '2')
      .reduce((s, c) => s + Number(c.amount ?? 0), 0);
    return sum + total;
  }, 0);

  const totalTransferenciasEntrada = statementDataList
    .flatMap(d => d.concileds || [])
    .filter(c => c.type === 'transfer' && c.amount > 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const totalTransferenciasSaida = statementDataList
    .flatMap(d => d.concileds || [])
    .filter(c => c.type === 'transfer' && c.amount < 0)
    .reduce((sum, c) => sum + c.amount, 0);

  const transferenciasSaldo = totalTransferenciasEntrada - totalTransferenciasSaida; 
  // note que Saída é negativa, então basta somar

  const saldoFinal = entradas - saidas;

  // ---- lista que a tabela vai usar ----
  const filteredDataList = statementDataList.filter(data => {
    if (filterTypes.length === 0) return true;

    return filterTypes.some(ft => {
      switch(ft) {
        case 'entrada': return data.credit > 0;
        case 'saida': return data.debit < 0;
        case 'saldo': return true; // pode ignorar ou aplicar regra
        case 'receber': return (data.concileds || []).some(c => c.type === '1');
        case 'pagar': return (data.concileds || []).some(c => c.type === '2');
        case 'transferencia': return (data.concileds || []).some(c => c.type === 'transfer');
        case 'resultado': return true; 
        default: return true;
      }
    });
  });

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

  return (
    <>
      <BackdropLoading loading={loading} message={'Carregando...'} />
      <Dialog
        open={statementId !== undefined && !loading}
        onClose={onClose}
        fullWidth
        maxWidth="lg"
        scroll="paper"
        slotProps={{
          paper: {
            sx: { position: 'fixed', top: '32px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxHeight: 'calc(100vh - 64px)' }
          }
        }}
      >
        <DialogTitle sx={styles.dialogTitle}>
          Extrato detalhado
          <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose} size="large">
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent>

        <Box sx={{ mb: 2, mt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)", // 7 colunas iguais
              gap: 2,
            }}
          >
            {[
              { label: "Entradas", value: entradas, icon: "ri-arrow-down-circle-line", type: "entrada" },
              { label: "Saídas", value: saidas, icon: "ri-arrow-up-circle-line", type: "saida" },
              { label: "Saldo Final", value: saldoFinal, icon: "ri-wallet-3-line", type: "saldo" },
              { label: "Contas a pagar", value: contasAPagar * -1, icon: "ri-bill-line", type: "pagar" },
              { label: "Contas a receber", value: contasAReceber, icon: "ri-money-dollar-circle-line", type: "receber" },
              { label: "Transferências", value: transferenciasSaldo, icon: "ri-arrow-left-right-line", type: "transferencia" },
              { label: "Pendência", value: 0, icon: "ri-bar-chart-line", type: "resultado" },
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
                  border: filterTypes.includes(item.type) ? '3px solid' : '1px solid #ccc',
                  borderColor: filterTypes.includes(item.type) ? 'primary.main' : '#ccc',
                  position: 'relative', // necessário para posicionar o ícone
                }}
                onClick={() => {
                  setFilterTypes(prev => 
                    prev.includes(item.type) 
                      ? prev.filter(t => t !== item.type)  // remove se já estava selecionado
                      : [...prev, item.type]               // adiciona se não estava
                  );
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <i className={item.icon} style={{ fontSize: 22, color: "#1976d2" }} />
                  <Typography variant="body2" fontWeight="medium">
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
                {filterTypes.includes(item.type) && (
                  <i
                    className="ri-filter-line"
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      fontSize: 18,
                      color: '#1976d2',
                    }}
                  />
                )}
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
                <TableCell sx={{ width: 90 }} align="right">Saldo</TableCell>
                <TableCell sx={{ width: 90 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDataList.map((data, index) => {
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

                const rowColor = (data.concileds?.length > 0 && data.concileds.every(c => c.isConciled))
                            ? '#155724' // verde claro quando todos concileds.isConciled = true
                            : 'inherit'

                return (
                  <Fragment key={data.id || index}>
                    {/* Linha principal */}
                    {editingRowIndex !== index && (
                      <TableRow
                        hover
                        style={{ cursor: 'pointer' }}
                        //onClick={() => toggleExpand(index)}
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
                        <TableCell sx={{ width: 140 }}><Typography fontSize={12} color={rowColor}>{data.sourceId}</Typography></TableCell>
                        <TableCell><Typography fontSize={12} color={rowColor}>{data.entryDate ? format(data.entryDate, 'dd/MM/yyyy HH:mm') : ""}</Typography></TableCell>
                        <TableCell><Typography fontSize={12} color={rowColor}>{data.reference}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={12} color={rowColor}>{formatCurrency(data.amount)}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={12} color={rowColor}>{formatCurrency(data.fee)}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography fontSize={12} color='green'>{Number(data.credit) > 0 && `+${formatCurrency(data.credit)}`}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontSize={12} color='red'>{Number(data.debit) < 0 && formatCurrency(data.debit)}</Typography>
                        </TableCell>
                        <TableCell align="right"><Typography fontSize={12} color={rowColor}>{formatCurrency(data.balance)}</Typography></TableCell>
                        <TableCell align="left" sx={{ width: 80 }}>
                          <Box className="actions-container">
                            <IconButton
                              sx={{
                                p: 0, width: 24, height: 24, borderRadius: '50%',
                                fontSize: 12,
                                backgroundColor: _.size(data.concileds) > 0 ? 'var(--mui-palette-primary-dark)' : '#C0C0C0',
                                color: '#fff',
                                '&:hover': { backgroundColor: 'primary.dark' },
                              }}
                              className="concileds"
                            >
                              {_.size(data.concileds) || 0}
                            </IconButton>

                            <Tooltip title='Editar'>
                              <IconButton
                                sx={{
                                  p: 0, width: 24, height: 24, borderRadius: '50%',
                                  backgroundColor: '#f57c00',
                                  color: '#fff',
                                  '&:hover': { backgroundColor: 'primary.dark' },
                                }}
                                onClick={(e) => {
                                  Swal.fire({
                                    icon: `warning`,
                                    title: `Ops`,
                                    text: `Sem permissão para editar!`,
                                    confirmButtonText: `Ok`
                                  })
                                  //e.stopPropagation();
                                  //setEditingRowIndex(index);
                                }}
                                className="edit"
                              >
                                <i className="ri-pencil-line" style={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>

                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); toggleExpand(index); }}
                              sx={{
                                border: '2px solid #ccc',
                                borderRadius: '50%',
                                p: 0,
                                width: 32,
                                height: 32,
                                color: expandedRow === index ? 'tomato' : 'inherit',
                              }}
                              className="expand"
                            >
                              {expandedRow === index ? (
                                <i className="ri-arrow-up-line" style={{ fontSize: 25 }} />
                              ) : (
                                <i className="ri-arrow-down-line" style={{ fontSize: 25 }} />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Linha de edição */}
                    {editingRowIndex === index && (
                      <StatementDataForm
                        initialValues={data}
                        onCancel={() => setEditingRowIndex(null)}
                        onFormSubmitted={async () => {
                          await fetchStatement(false);
                          setEditingRowIndex(null);
                        }}
                      />
                    )}

                    {/* Linha expandida */}
                    {expandedRow === index && (
                      <ConciledDetailRowsGroup
                        data={{
                          ...data,
                          concileds: (data.concileds || []).filter(c => {
                            if (filterTypes.length === 0) return true;

                            return filterTypes.some(ft => {
                              switch(ft) {
                                case 'entrada':
                                  return c.type === 'entrada' && c.amount > 0;
                                case 'saida':
                                  return c.type === 'saida' && c.amount < 0;
                                case 'receber':
                                  return c.type === '1';
                                case 'pagar':
                                  return c.type === '2';
                                case 'transferencia':
                                  return c.type === 'transfer';
                                default:
                                  return true;
                              }
                            });
                          })
                        }}
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

              {/* Linha de adicionar novo lançamento */}
              <TableRow key="add-statement-row">
                <TableCell colSpan={11} sx={{ borderBottom: "none", p: 1 }}>
                  {isAddingNewStatement ? (
                    <StatementDataForm
                      onFormSubmitted={async () => {
                        await handleFinishAddStatement();
                      }}
                      onCancel={() => setIsAddingNewStatement(false)}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        type="button"
                        variant="text"
                        startIcon={<i className="ri-add-circle-line" />}
                        onClick={handleStartAddStatement}
                      >
                        Adicionar lançamento
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>

          </Table>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <div>
            {selectedStatements.size > 0 ? (
              <Button variant="outlined" color="error" startIcon={<i className="ri-delete-bin-line" style={{ fontSize: 18 }} />} onClick={async () => {
                Swal.fire({
                  icon: `warning`,
                  title: `Ops`,
                  text: `Sem permissão para excluir!`,
                  confirmButtonText: `Ok`
                })
                //await statements.deleteData({id: Array.from(selectedStatements)})
                //await fetchStatement(false)
              }}>
                Excluir
              </Button>
            ) : (
              <>
              {/*
                <Button variant="outlined" color="info" startIcon={<i className="ri-delete-bin-line" style={{ fontSize: 18 }} />} onClick={() => statements.refresh()}>
                  Buscar
                </Button>
              */}
              </>
            )}
          </div>
          <div>
            {selectedConcileds.size > 0 && (
              <>
                <Button variant="text" onClick={async () => {
                  try {

                    setDesconciling(true)

                    await statements.desconcile({id: Array.from(selectedConcileds)})
                  
                    await fetchStatement(false)

                    toast.success('Desconciliado com sucesso!')
                    
                  } catch (error) {
                    console.log(error)
                  } finally {
                    setDesconciling(false)
                  }
                }} startIcon={<i className="ri-link-unlink" style={{ fontSize: 18 }} />} disabled={desconciling}>
                  {desconciling ? 'Desconciliando' : 'Desconciliar'}
                </Button>
                <Button variant="contained" color="success" onClick={async () => {
                  try {

                    setConciling(true)
                    
                    await statements.concile({id: Array.from(selectedConcileds)})
                  
                    await fetchStatement(false)

                    toast.success('Conciliado com sucesso!')

                  } catch (error) {
                    console.log(error)
                  } finally {
                    setConciling(false)
                  }
                }} sx={{ ml: 1 }} startIcon={<i className="ri-check-line" style={{ fontSize: 18 }} />} disabled={conciling}>
                  {conciling ? 'Conciliando' : 'Conciliar'}
                </Button>
              </>

            )}
            
          </div>
        </DialogActions>
      </Dialog>
      <ViewVinculePayment
        open={isDrawerOpen}
        onClose={handleClosePayments}
        itemId={selectedItemId}
        onSelected={handleVinculePayment}
      />
      <ViewVinculeReceivement
        open={isDrawerReceivement}
        onClose={handleCloseReceivements}
        itemId={receivementId}
        onSelected={handleVinculeReceivement}
      />
    </>
  )
}

function StatementDataForm({ initialValues, onFormSubmitted, onCancel }) {
  const validationSchema = Yup.object({
    reference: Yup.string().required("Referência obrigatória"),
    amount: Yup.number().typeError("Valor inválido").required("Obrigatório"),
    entryDate: Yup.date().typeError("Data inválida").required("Obrigatória"),
  });

  const handleSubmitInternal = async (values, { setSubmitting }) => {
    try {
      //await statements.saveStatementData(values); // 🔹 você implementa no service (igual saveConciled)
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
 
          {/* SourceId (não editável, só mostra valor) */}
          <TableCell sx={{ width: 150 }} colSpan={2}>
            <TextField
              fullWidth
              size="small"
              name="sourceId"
              value={values.sourceId}
              onChange={handleChange}
            />
          </TableCell>

          {/* EntryDate */}
          <TableCell sx={{ width: 140 }}>
            <TextField
              fullWidth
              size="small"
              type="datetime-local"
              name="entryDate"
              value={format(values.entryDate, "yyyy-MM-dd'T'HH:mm")}
              onChange={handleChange}
            />
          </TableCell>

          {/* Reference */}
          <TableCell>
            <TextField
              fullWidth
              size="small"
              name="reference"
              value={values.reference}
              onChange={handleChange}
            />
          </TableCell>

          {/* Amount */}
          <TableCell align="right">
            <TextField
              fullWidth
              size="small"
              type="number"
              name="amount"
              value={values.amount}
              onChange={handleChange}
            />
          </TableCell>

          {/* Fee */}
          <TableCell align="right">
            <TextField
              fullWidth
              size="small"
              type="number"
              name="fee"
              value={values.fee}
              onChange={handleChange}
            />
          </TableCell>

          {/* Credit */}
          <TableCell align="right">
            <TextField
              fullWidth
              size="small"
              type="number"
              name="credit"
              value={values.credit}
              onChange={handleChange}
            />
          </TableCell>

          {/* Debit */}
          <TableCell align="right">
            <TextField
              fullWidth
              size="small"
              type="number"
              name="debit"
              value={values.debit}
              onChange={handleChange}
            />
          </TableCell>

          {/* Balance (não editável) */}
          <TableCell align="right">{formatCurrency(values.balance || 0)}</TableCell>

          {/* Actions */}
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
      <TableCell colSpan={3} />
    </TableRow>
  );

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
  
  return (
    <TableRow sx={{
        backgroundColor: '#fafafa',
        cursor: 'pointer'
      }}
      className="with-hover-actions"
      onDoubleClick={onStartEdit}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={isSelected}
          onChange={onToggleSelection}
          inputProps={{ 'aria-labelledby': `conciled-item-${item.id}` }}
        />
      </TableCell>
      <TableCell id={`conciled-item-${item.id}`}>
        <Typography color={rowColor} fontSize={12}>{typeDescription(item.type)}</Typography>
      </TableCell>
      <TableCell colSpan={2}>
        <Typography color={rowColor} fontSize={12}>
          {(item.type === '1' || item.type === '2') && (
            <>
              {item.partner?.surname}<br />
              {item.category?.description}
            </>
          )}

          {item.type === 'transfer' && (
            <>
              {item.origin?.name}
              {item.origin?.agency && item.origin?.number
                ? ` - ${item.origin.agency} / ${item.origin.number}`
                : ""}
              <br />
              {item.destination?.name}
              {item.destination?.agency && item.destination?.number
                ? ` - ${item.destination.agency} / ${item.destination.number}`
                : ""}
            </>
          )}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography color={rowColor} fontSize={12}>
          {formatCurrency(item.amount)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography color={rowColor} fontSize={12}>
          {formatCurrency(item.fee)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography color={rowColor} fontSize={12}>
          {formatCurrency(item.discount)}
        </Typography>
      </TableCell>
      <TableCell colSpan={2}>
        {(!item.isConciled) && (
          <Box className="row-actions">
            <Tooltip title='Editar'><IconButton onClick={onStartEdit}><i className="ri-pencil-line" /></IconButton></Tooltip>
            <Tooltip title='Excluir'><IconButton onClick={() => onDelete(item)}><i className="ri-delete-bin-line" /></IconButton></Tooltip>
          </Box>
        )}
      </TableCell>
      <TableCell align='left'>
        <Box sx={{ display: 'flex' }}>
          {(!item.isConciled) && (
            <>
              {(!item.paymentId && !item.receivementId) ? (
                <>
                  {/* --- MODIFICADO: Passando o objeto 'item' completo em vez de apenas 'item.id' --- */}
                  <IconButton className="row-actions" size='small' onClick={() => onViewDetails(item)} sx={{ p: 1 }}><i className="ri-search-line" /></IconButton>
                </>
              ) : (
                <>
                  
                  <Tooltip
                    title={
                      <>
                        <Typography fontSize={18} color='white'>Conta a {item.paymentId ? 'pagar': 'receber'}</Typography>
                        <ul style={{ paddingLeft: '18px' }}>
                          <li>Cliente: {item.receivement?.financialMovement?.partner?.surname || item.payment?.financialMovement?.partner?.surname}</li>
                          <li>Valor: {item.receivement?.amount || item.payment?.amount}</li>
                          <li>Observação: {item.receivement?.observation || item.payment?.observation}</li>
                        </ul>
                      </>
                    }
                    placement="left"
                    slotProps={{
                      tooltip: {
                        sx: {
                          width: 900, // largura fixa
                          maxWidth: 'unset', // remove limite padrão
                          fontSize: 13,
                        },
                      },
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={handleInfoClick}
                      sx={{
                        p: 1,
                        backgroundColor: '#4ace4aff',
                        '&:hover': { backgroundColor: 'success.dark' },
                        width: 24,
                        height: 24,
                      }}
                    >
                      <i className="ri-checkbox-circle-fill" style={{ color: '#fff' }} />
                    </IconButton>
                  </Tooltip>

                  <Menu
                    anchorEl={infoAnchorEl}
                    open={Boolean(infoAnchorEl)}
                    onClose={handleInfoClose}
                  >
                    <MenuItem onClick={() => { handleInfoClose(); onDesvincule(item.id); }}><i className="ri-link-unlink" style={{ marginRight: 8 }} /> Desvincular</MenuItem>
                    {item.receivement?.financialMovement?.externalId && (
                      <MenuItem
                        onClick={() => {
                          handleInfoClose();
                          window.open(`https://erp.tiny.com.br/contas_receber#edit/${item.receivement?.financialMovement?.externalId}`, "_blank", "noopener,noreferrer")
                        }}
                      >
                        <i className="ri-external-link-line" style={{ marginRight: 8 }} /> 
                        Abrir link externo
                      </MenuItem>
                    )}
                    {item.payment?.financialMovement?.externalId && (
                      <MenuItem
                        onClick={() => {
                          handleInfoClose();
                          window.open(`https://erp.tiny.com.br/contas_pagar#edit/${item.payment?.financialMovement?.externalId}`, "_blank", "noopener,noreferrer")
                        }}
                      >
                        <i className="ri-external-link-line" style={{ marginRight: 8 }} /> 
                        Abrir link externo
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </>
          )}
          
          {(item.message != null) && (
            <>
              <Tooltip title={item.message}><IconButton size='small' sx={{ p: 1, backgroundColor: 'red', '&:hover': { backgroundColor: 'red' }, width: 24, height: 24 }}><i className="ri-close-circle-fill" style={{ color: '#fff' }} /></IconButton></Tooltip>
            </>
          )}

        </Box>
      </TableCell>
    </TableRow>
  )
}

function ConciliationForm({ statementDataId, isSelected, initialValues, onFormSubmitted, onCancel }) {
  const validationSchema = Yup.object({
    /*
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
    */
  });

  const handleSubmitInternal = async (values, { setSubmitting }) => {
    console.log(values)
    setSubmitting(true);
    try {
      await statements.saveConciled(statementDataId, values);
      await onFormSubmitted();
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar a conciliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues || { type: '', partner: null, category: null, origin: null, destination: null, bankAccount: null, amount: '', fee: '', discount: '' }}
      validationSchema={validationSchema}
      enableReinitialize={true}
      onSubmit={handleSubmitInternal}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue, setFieldTouched }) => (
        <TableRow sx={{ backgroundColor: '#fafafa' }}>
          <TableCell padding="checkbox">
            <Checkbox color="primary" checked={isSelected} disabled />
          </TableCell>
          <TableCell sx={{ p: 1 }}>
            <Select
              fullWidth size="small" name="type" value={values.type}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value !== 'payment' && e.target.value !== 'receivement') {
                  setFieldValue('partner', null);
                  setFieldTouched('partner', false);
                }
              }}
              onBlur={handleBlur} displayEmpty error={touched.type && Boolean(errors.type)}
              sx={{ backgroundColor: '#fff' }}
            >
              <MenuItem value="">[Selecione]</MenuItem>
              <MenuItem value="2">Pagamento</MenuItem>
              <MenuItem value="1">Recebimento</MenuItem>
              <MenuItem value="transfer">Transferência</MenuItem>
            </Select>
            {touched.type && errors.type && (
              <Typography variant="caption" color="error">{errors.type}</Typography>
            )}
          </TableCell>
          <TableCell sx={{ p: 1 }} colSpan={2}>
            {(values.type === '1' || values.type === '2') && (
              <>
                <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Cliente" name="partner" text={(partner) => partner?.surname} onSearch={getPartner} renderSuggestion={(item) => (<span>{item.surname}</span>)} />
                <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Categoria" name="category" text={(category) => category?.description || ''} onSearch={(search) => getFinancialCategory(search)} renderSuggestion={(item) => (<span>{item.description}</span>)} />
              </>
            )}
            {(values.type === 'transfer') && (
              <>
                <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Origem" name="origin" text={(bankAccount) => `${bankAccount.name} - ${bankAccount.agency} / ${bankAccount.number}`} onSearch={getBankAccounts} renderSuggestion={(bankAccount) => (<span>{bankAccount.name} - {bankAccount.agency} / {bankAccount.number}</span>)} />
                <Field variant="outlined" sx={{ backgroundColor: '#fff' }} component={AutoComplete} placeholder="Destino" name="destination" text={(bankAccount) => `${bankAccount.name} - ${bankAccount.agency} / ${bankAccount.number}`} onSearch={getBankAccounts} renderSuggestion={(bankAccount) => (<span>{bankAccount.name} - {bankAccount.agency} / {bankAccount.number}</span>)} />
              </>
            )}
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