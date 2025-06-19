'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Grid, InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress, TextField } from "@mui/material";
import { AutoComplete } from "@/components/AutoComplete";
import { styles } from "@/components/styles";
import { getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { getPaymentMethod } from "@/utils/search";
import { addDays, addMonths, format } from "date-fns";

export const ViewPaymentInstallment = ({ installmentId, onClose }) => {

  if (installmentId === null) {
    return <NewInstallmentModal installmentId={installmentId} onClose={onClose} />;
  }

  return <EditInstallmentModal installmentId={installmentId} onClose={onClose} />;
};

const EditInstallmentModal = ({ installmentId, onClose }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [installment, setInstallment] = useState(null);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    const fetchInstallment = async () => {
      setLoading(true);
      try {
        const data = await getInstallment({ installmentId });
        setInstallment(data);
      } catch (error) {
        setErrorState(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstallment();
  }, [installmentId]);

  const initialValues = {
    amount: installment?.amount || 0,
    paymentMethod: installment?.paymentMethod || null,
    digitableLine: installment?.boleto?.digitableLine || "",
    dueDate: installment?.boleto?.dueDate || "",
    boletoNumber: installment?.boleto?.number || "",
  };

  const handleSubmit = async (values) => {
    values.codigo_movimento_detalhe = installmentId;
    values.paymentMethodId = values.paymentMethod?.id || null;
    const updated = await submitInstallment(values);
    onClose(updated);
  };

  return (
    <>
      <Backdrop open={installmentId !== undefined && !loading} sx={{ zIndex: theme.zIndex.modal + 1, color: "#fff", flexDirection: "column" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2, color: "#fff" }}>
          Carregando...
        </Typography>
      </Backdrop>

      <Dialog open={installmentId !== undefined && !loading} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={styles.dialogTitle}>
          Editar Parcela
          <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose}>
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, setFieldValue, isSubmitting }) => (
            <Form>
              <DialogContent>
                <AutoComplete
                  name="paymentMethod"
                  size="small"
                  label="Forma de pagamento"
                  value={values.paymentMethod}
                  text={(p) => p?.name}
                  onChange={(val) => setFieldValue("paymentMethod", val)}
                  onSearch={getPaymentMethod}
                >
                  {(item) => <span>{item.name}</span>}
                </AutoComplete>

                <TextField name="digitableLine" label="Linha digitável" fullWidth size="small" margin="dense" value={values.digitableLine} onChange={handleChange} />
                <TextField name="dueDate" label="Data de vencimento" type="date" fullWidth size="small" margin="dense" value={values.dueDate} InputLabelProps={{ shrink: true }} onChange={handleChange} />
                <TextField name="boletoNumber" label="Nosso número / Nº do boleto" fullWidth size="small" margin="dense" value={values.boletoNumber} onChange={handleChange} />
              </DialogContent>

              <DialogActions>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  );
};

const INTERVAL_OPTIONS = [
  { label: 'Semanal', value: 'weekly' },
  { label: 'Quinzenal', value: 'biweekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
  { label: 'Personalizado', value: 'custom' }
];

const NewInstallmentModal = ({ installmentId, onClose }) => {
  const [parcelas, setParcelas] = useState([]);

  const [documentNumber, setDocumentNumber] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [numParcelas, setNumParcelas] = useState(1);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [interval, setInterval] = useState('monthly');
  const [customDays, setCustomDays] = useState(30);

  const generateParcelas = () => {
    if (!valorTotal || !startDate || !numParcelas) return;

    const total = parseFloat(valorTotal);
    const baseAmount = +(total / numParcelas).toFixed(2);
    const diff = +(total - baseAmount * numParcelas).toFixed(2);

    const list = [];
    for (let i = 0; i < numParcelas; i++) {
      const dueDate = getDueDate(startDate, i);
      const amount = i === numParcelas - 1 ? +(baseAmount + diff).toFixed(2) : baseAmount;

      list.push({
        amount,
        dueDate,
        digitableLine: '',
        boletoNumber: ''
      });
    }

    setParcelas(list);
  };

  const getDueDate = (start, index) => {
    const date = new Date(start);
    switch (interval) {
      case 'weekly': return format(addDays(date, 7 * index), 'yyyy-MM-dd');
      case 'biweekly': return format(addDays(date, 15 * index), 'yyyy-MM-dd');
      case 'monthly': return format(addMonths(date, index), 'yyyy-MM-dd');
      case 'quarterly': return format(addMonths(date, index * 3), 'yyyy-MM-dd');
      case 'yearly': return format(addMonths(date, index * 12), 'yyyy-MM-dd');
      case 'custom': return format(addDays(date, customDays * index), 'yyyy-MM-dd');
      default: return format(date, 'yyyy-MM-dd');
    }
  };

  const handleParcelaChange = (index, field, value) => {
    const updated = [...parcelas];
    updated[index][field] = value;
    setParcelas(updated);
  };

  const handleSubmit = async () => {
    console.log('Parcelas salvas:', parcelas);
    onClose(parcelas);
  };

  useEffect(() => {
    generateParcelas();
  }, [valorTotal, numParcelas, startDate, interval, customDays]);

  return (
    <Dialog open={installmentId == null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={styles.dialogTitle}>
        Adicionar conta a pagar
        <IconButton aria-label="close" onClick={onClose} sx={styles.dialogClose}>
          <i className="ri-close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ m: 2 }}>

        <Grid container columnSpacing={2} rowSpacing={3}>

          <Grid item size={{xs: 12, sm: 2.6}}>
            <TextField
              fullWidth
              label="Número"
              size="small"
              variant="filled"
              slotProps={{ inputLabel: { shrink: true } }}
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </Grid>

          <Grid item size={{xs: 12, sm: 2.2}}>
            <TextField
              fullWidth
              label="Valor"
              size="small"
              variant="filled"
              slotProps={{ inputLabel: { shrink: true } }}
              type="number"
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
            />
          </Grid>

          <Grid item size={{xs: 12, sm: 2.5}}>
            <TextField
              fullWidth
              label="Emissão"
              size="small"
              variant="filled"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item size={{xs: 12, sm: 2.5}}>
            <TextField
              fullWidth
              label="Vencimento"
              size="small"
              variant="filled"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item size={{xs: 12, sm: 2.2}}>
            <TextField
              fullWidth
              label="Nº de parcelas"
              size="small"
              variant="filled"
              slotProps={{ inputLabel: { shrink: true } }}
              select
              value={numParcelas}
              onChange={(e) => setNumParcelas(parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {numParcelas > 1 && (
            <>
              <Grid item size={{xs: 12, sm: 2.3}}>
                <TextField
                  fullWidth
                  label="Intervalo"
                  size="small"
                  variant="filled"
                  slotProps={{ inputLabel: { shrink: true } }}
                  select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {interval === 'custom' && (
                <Grid item size={{xs: 12, sm: 2}}>
                  <TextField
                    fullWidth
                    label="A cada"
                    size="small"
                    variant="filled"
                    type="number"
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">dias</InputAdornment>
                    }}
                  />
                </Grid>
              )}
            </>
          )}

          <Grid item size={{xs: 12, sm: 12}}>
            <TextField
              fullWidth
              label="Descrição"
              size="small"
              variant="filled"
              slotProps={{ inputLabel: { shrink: true } }}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
        </Grid>

        <Table size="small" sx={{mt: 5}}>
          <TableHead>
            <TableRow>
              <TableCell>Nº Documento</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parcelas.map((parcela, index) => (
              <TableRow key={index}>
                <TableCell>
                  
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={parcela.amount}
                    onChange={(e) => handleParcelaChange(index, 'amount', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="date"
                    value={parcela.dueDate}
                    onChange={(e) => handleParcelaChange(index, 'dueDate', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={handleSubmit} disabled={parcelas.length === 0}>
          Criar Movimento
        </Button>
      </DialogActions>
    </Dialog>
  );
};
