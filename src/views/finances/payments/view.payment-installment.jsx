'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Grid, InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress, TextField } from "@mui/material";
import { AutoComplete } from "@/components/AutoComplete";
import { styles } from "@/components/styles";
import { createMovement, getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { getPartner, getPaymentMethod } from "@/utils/search";
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
        console.log(data)
        //setInstallment(data);
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
      <Backdrop open={installmentId !== undefined && loading} sx={{ zIndex: theme.zIndex.modal + 1, color: "#fff", flexDirection: "column" }}>
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
  const [formData, setFormData] = useState({
    documentNumber: '',
    amountTotal: '',
    numParcelas: 1,
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    interval: 'monthly',
    customDays: 30,
    paymentMethod: undefined,
    description: '',
    installments: [],
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateInstallments = () => {
    const { amountTotal, startDate, numParcelas, interval, customDays } = formData;
    if (!amountTotal || !startDate || !numParcelas) return;

    const total = parseFloat(amountTotal);
    const baseAmount = +(total / numParcelas).toFixed(2);
    const diff = +(total - baseAmount * numParcelas).toFixed(2);

    const list = [];
    for (let i = 0; i < numParcelas; i++) {
      const dueDate = getDueDate(startDate, i, interval, customDays);
      const amount = i === numParcelas - 1 ? +(baseAmount + diff).toFixed(2) : baseAmount;

      list.push({
        installment: i + 1,
        amount,
        dueDate,
        digitableLine: '',
        boletoNumber: '',
      });
    }

    setFormData(prev => ({ ...prev, installments: list }));
  };

  const getDueDate = (start, index, interval, customDays) => {
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

  const handleInstallmentChange = (index, field, value) => {
    const updated = [...formData.installments];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, installments: updated }));
  };

  const handleSubmit = async () => {
    await createMovement(formData);
    onClose()
    //console.log('Parcelas salvas:', formData.installments);
  };

  useEffect(() => {
    generateInstallments();
  }, [formData.amountTotal, formData.numParcelas, formData.startDate, formData.interval, formData.customDays]);

  return (
    <Dialog
      open={installmentId == null}
      onClose={onClose}
      maxWidth="md"
      fullWidth
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
      <DialogTitle>
        Adicionar conta a pagar
        <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <i className="ri-close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ m: 2 }}>
        <Grid container columnSpacing={2} rowSpacing={3}>

          <Grid item size={{ xs: 12, sm: 2.6 }}>
            <TextField
              fullWidth label="Número" size="small" variant="filled"
              value={formData.documentNumber}
              onChange={(e) => updateField('documentNumber', e.target.value)}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 2.2 }}>
            <TextField
              fullWidth label="Valor" size="small" variant="filled" type="number"
              value={formData.amountTotal}
              onChange={(e) => updateField('amountTotal', e.target.value)}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 2.5 }}>
            <TextField
              fullWidth label="Emissão" size="small" variant="filled" type="date"
              value={formData.issueDate}
              onChange={(e) => updateField('issueDate', e.target.value)}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 2.5 }}>
            <TextField
              fullWidth label="Vencimento" size="small" variant="filled" type="date"
              value={formData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
            />
          </Grid>

          <Grid item size={{ xs: 12, sm: 2.2 }}>
            <TextField
              fullWidth label="Nº de parcelas" size="small" variant="filled" select
              value={formData.numParcelas}
              onChange={(e) => updateField('numParcelas', parseInt(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {formData.numParcelas > 1 && (
            <>
              <Grid item size={{ xs: 12, sm: 2.3 }}>
                <TextField
                  fullWidth label="Intervalo" size="small" variant="filled" select
                  value={formData.interval}
                  onChange={(e) => updateField('interval', e.target.value)}
                >
                  {INTERVAL_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {formData.interval === 'custom' && (
                <Grid item size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth label="A cada" size="small" variant="filled" type="number"
                    value={formData.customDays}
                    onChange={(e) => updateField('customDays', parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">dias</InputAdornment>
                    }}
                  />
                </Grid>
              )}
            </>
          )}

          <Grid item size={{ xs: 12 }}>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <AutoComplete
                name="receiver"
                size="small"
                label="Recebedor"
                value={formData.receiver}
                text={(p) => p?.surname}
                onChange={(receiver) => updateField('receiver', receiver)}
                onSearch={getPartner}
              >
                {(item) => <span>{item.surname}</span>}
              </AutoComplete>
            </Grid>

            <Grid item size={{ xs: 12, sm: 4 }}>
              <AutoComplete
                name="paymentMethod"
                size="small"
                label="Forma de pagamento"
                value={formData.paymentMethod}
                text={(p) => p?.name}
                onChange={(paymentMethod) => updateField('paymentMethod', paymentMethod)}
                onSearch={getPaymentMethod}
              >
                {(item) => <span>{item.name}</span>}
              </AutoComplete>
            </Grid>
          </Grid>

          <Grid item size={{ xs: 12, sm: 12 }}>
            <TextField
              fullWidth label="Descrição" size="small" variant="filled"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </Grid>
        </Grid>

        <Table size="small" sx={{ mt: 5 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nº Documento</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {formData.installments.map((parcela, index) => (
              <TableRow key={index}>
                <TableCell>{parcela.installment}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={parcela.amount}
                    onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="date"
                    value={parcela.dueDate}
                    onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={handleSubmit} disabled={formData.installments.length === 0}>
          Criar Movimento
        </Button>
      </DialogActions>
    </Dialog>
  );
};