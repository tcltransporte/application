'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Grid, InputAdornment } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress } from "@mui/material";
import { AutoComplete } from "@/components/AutoComplete";
import { styles } from "@/components/styles";
import { createMovement, getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { getPartner, getPaymentMethod } from "@/utils/search";
import { addDays, addMonths, format } from "date-fns";

import { CurrencyField, TextField } from "@/components/field";

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
        const installment = await getInstallment({ installmentId });
        setInstallment(installment);
      } catch (error) {
        setErrorState(error);
      } finally {
        setLoading(false);
      }
    };

    if (installmentId) {
      fetchInstallment();
    }
  }, [installmentId]);

  const initialValues = {
    amount: installment?.amount || 0,
    paymentMethod: installment?.paymentMethod || null,
    digitableLine: installment?.boleto?.digitableLine || "",
    dueDate: installment?.dueDate || "",
    boletoNumber: installment?.boleto?.number || "",
  };

  const handleSubmit = async (values, actions) => {
    try {
      values.codigo_movimento_detalhe = installmentId;
      values.paymentMethodId = values.paymentMethod?.id || null;
      const updated = await submitInstallment(values);
      onClose(updated);
    } catch (error) {
      console.error(error.message);
      actions.setSubmitting(false);
    }
  };

  return (
    <>
      <Backdrop open={installmentId !== undefined && loading} sx={{ zIndex: 1200, color: "#fff", flexDirection: "column" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2, color: "#fff" }}>
          Carregando...
        </Typography>
      </Backdrop>

      <Dialog open={installmentId !== undefined && !loading} onClose={onClose} maxWidth="xs" fullWidth slotProps={{
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
        }}>
        <DialogTitle sx={styles.dialogTitle}>
          Editar Parcela
          <IconButton aria-label="close" onClick={onClose} sx={styles.dialogClose}>
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form>
              <DialogContent>

                <Field
                  type="text"
                  name="amount"
                  label="Valor"
                  component={CurrencyField}
                />

                <AutoComplete
                  name="paymentMethod"
                  label="Forma de pagamento"
                  value={values.paymentMethod}
                  text={(p) => p?.name}
                  onChange={(val) => setFieldValue("paymentMethod", val)}
                  onSearch={getPaymentMethod}
                >
                  {(item) => <span>{item.name}</span>}
                </AutoComplete>

                <Field
                  type="text"
                  name="digitableLine"
                  label="Linha digitável"
                  component={TextField}
                />

                <Field
                  type="date"
                  name="dueDate"
                  label="Vencimento"
                  component={TextField}
                />

                <Field
                  type="text"
                  name="boletoNumber"
                  label="Nosso número / Nº do boleto"
                  as={TextField}
                />
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
  
  const initialValues = {
    documentNumber: '',
    amountTotal: '',
    numParcelas: 1,
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    interval: 'monthly',
    customDays: 30,
    paymentMethod: undefined,
    receiver: undefined,
    description: '',
    installments: [],
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

  return (
    <Dialog open={installmentId == null} onClose={onClose} maxWidth="md">
      <DialogTitle>
        Adicionar conta a pagar
        <IconButton aria-label="close" onClick={onClose} sx={styles.dialogClose}>
          <i className="ri-close-line" />
        </IconButton>
      </DialogTitle>

      <Formik
        initialValues={initialValues}
        onSubmit={async (values) => {
          await createMovement(values);
          onClose();
        }}
      >
        {({ values, setFieldValue }) => {
          // Atualiza parcelas sempre que campos relacionados mudarem
          useEffect(() => {
            const { amountTotal, startDate, numParcelas, interval, customDays } = values;
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

            setFieldValue('installments', list);
          }, [values.amountTotal, values.numParcelas, values.startDate, values.interval, values.customDays]);

          const handleInstallmentChange = (index, field, value) => {
            const updated = [...values.installments];
            updated[index][field] = value;
            setFieldValue('installments', updated);
          };

          return (
            <Form>
              <DialogContent sx={{ m: 2 }}>
                <Grid container spacing={2}>
                  <Grid item size={{xs: 12, sm: 2.7}}>
                    <Field
                      type="text"
                      name="documentNumber"
                      label="Nº Documento"
                      component={TextField}
                    />
                  </Grid>
                  <Grid item size={{xs: 12, sm: 2.2}}>
                    <Field
                      type="text"
                      name="amountTotal"
                      label="Valor"
                      component={CurrencyField}
                    />
                  </Grid>
                  <Grid item size={{xs: 12, sm: 2.4}}>
                    <Field
                      type="date"
                      name="issueDate"
                      label="Emissão"
                      component={TextField}
                    />
                  </Grid>
                  <Grid item size={{xs: 12, sm: 2.4}}>
                    <Field
                      type="date"
                      name="startDate"
                      label="Vencimento"
                      component={TextField}
                    />
                  </Grid>
                  <Grid item size={{xs: 12, sm: 2.3}}>
                    <Field
                      name="numParcelas"
                      as={TextField}
                      select
                      fullWidth
                      label="Nº de parcelas"
                      size="small"
                      variant="filled"
                    >
                      {[...Array(12)].map((_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {i + 1}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>

                  {values.numParcelas > 1 && (
                    <>
                      <Grid item size={{xs: 12, sm: 2.3}}>
                        <Field name="interval">
                          {({ field }) => (
                            <TextField fullWidth label="Intervalo" size="small" variant="filled" select {...field}>
                              {INTERVAL_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                              ))}
                            </TextField>
                          )}
                        </Field>
                      </Grid>

                      {values.interval === 'custom' && (
                        <Grid item size={{xs: 12, sm: 2}}>
                          <Field
                            type="number"
                            name="customDays"
                            label="A cada"
                            InputProps={{ endAdornment: <InputAdornment position="end">dias</InputAdornment> }}
                            component={TextField}
                          />
                        </Grid>
                      )}
                    </>
                  )}

                  <Grid item size={{xs: 12, sm: 12}}>
                    <Field
                      type="text"
                      name="description"
                      label="Descrição"
                      component={TextField}
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
                    {values.installments.map((inst, index) => (
                      <TableRow key={index}>
                        <TableCell>{values.documentNumber}-{inst.installment}</TableCell>
                        <TableCell>
                          <TextField
                            size="small" type="number"
                            value={inst.amount}
                            onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small" type="date"
                            value={inst.dueDate}
                            onChange={(e) => handleInstallmentChange(index, 'dueDate', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>

              <DialogActions>
                <Button variant="contained" type="submit" disabled={values.installments.length === 0}>
                  Criar Movimento
                </Button>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
};