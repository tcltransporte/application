'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Grid, InputAdornment } from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress } from "@mui/material";
import { styles } from "@/components/styles";
import { createMovement, getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { getBankAccounts, getCenterCost, getCompany, getFinancialCategory, getPartner, getPaymentMethod } from "@/utils/search";
import { addDays, addMonths, format } from "date-fns";

import { AutoComplete, NumericField, TextField } from "@/components/field";
import { useSession } from "next-auth/react";

const FIELD_SIZE = {

	documentNumber: 2.1,
	issueDate: 2,
  dueDate: 2,
  scheduledDate: 2,
	amountTotal: 2,
	installments: 1.9,

  receiver: 5.1,
  method: 3,
  bankAccount: 3.9,

  company: 3,
  centerCost: 4,
  category: 5,

  observation: 12

}

const INTERVAL_OPTIONS = [
  { label: 'Semanal', value: 'weekly' },
  { label: 'Quinzenal', value: 'biweekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Anual', value: 'yearly' },
  { label: 'Personalizado', value: 'custom' }
];

export const ViewPaymentInstallment = ({ installmentId, onClose }) => {

  return installmentId === null ? <NewInstallment installmentId={installmentId} onClose={onClose} /> : <EditInstallment installmentId={installmentId} onClose={onClose} />

}

const NewInstallment = ({ installmentId, onClose }) => {

  const session = useSession()

  const initialValues = {
    company: session.data.company,
    documentNumber: '',
    amountTotal: '',
    numParcelas: 1,
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledDate: null,
    interval: 'monthly',
    customDays: 30,
    centerCost: null,
    paymentMethod: null,
    bankAccount: null,
    receiver: null,
    observation: '',
    installments: [],
  }

  const parseLocalDate = (str) => {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDueDate = (start, index, interval, customDays) => {
    const date = parseLocalDate(start);
    switch (interval) {
      case 'weekly': return format(addDays(date, 7 * index), 'yyyy-MM-dd')
      case 'biweekly': return format(addDays(date, 15 * index), 'yyyy-MM-dd')
      case 'monthly': return format(addMonths(date, index), 'yyyy-MM-dd')
      case 'quarterly': return format(addMonths(date, index * 3), 'yyyy-MM-dd')
      case 'yearly': return format(addMonths(date, index * 12), 'yyyy-MM-dd')
      case 'custom': return format(addDays(date, customDays * index), 'yyyy-MM-dd')
      default: return format(date, 'yyyy-MM-dd');
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={async (values) => {
        await createMovement(values)
        onClose(true)
      }}
    >

      {({ values, setFieldValue, errors, touched, isSubmitting }) => {
        // Atualiza parcelas sempre que campos relacionados mudarem
        useEffect(() => {
          const { amountTotal, startDate, numParcelas, interval, customDays } = values;
          if (!amountTotal || !startDate || !numParcelas) return;

          const total = parseFloat(amountTotal);
          const baseAmount = +(total / numParcelas).toFixed(2);
          const diff = +(total - baseAmount * numParcelas).toFixed(2);

          const list = [];
          for (let i = 0; i < numParcelas; i++) {

            console.log(startDate)

            const dueDate = getDueDate(startDate, i, interval, customDays);
            const amount = i === numParcelas - 1 ? +(baseAmount + diff).toFixed(2) : baseAmount;

            console.log(amount)

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

        return (
          <Form>

            <Dialog open={installmentId == null} onClose={() => onClose(false)} maxWidth={'lg'} scroll="paper">

              <DialogTitle>
                Adicionar pagamento
                <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                  <i className="ri-close-line" />
                </IconButton>
              </DialogTitle>

              <DialogContent>
                
                <Grid container direction="row" spacing={2}>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.documentNumber}}>
                    <Field
                      component={TextField}
                      type="text"
                      name="documentNumber"
                      label="Nº Documento"
                      autoFocus
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.issueDate}}>
                    <Field
                      component={TextField}
                      type="date"
                      name="issueDate"
                      label="Emissão"
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.dueDate}}>
                    <Field
                      component={TextField}
                      type="date"
                      name="startDate"
                      label="Vencimento"
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.scheduledDate}}>
                    <Field
                      component={TextField}
                      type="text"
                      name="Agendamento"
                      label="Agendamento"
                      value={values.scheduledDate ? format(values.scheduledDate, "dd/MM/yyyy") : ''}
                      readOnly
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.amountTotal}}>
                    <Field
                      component={NumericField}
                      label="Valor"
                      name="amountTotal"
                      //error={Boolean(touched.amountTotal && errors.amountTotal)}
                      //helperText={touched.amountTotal && errors.amountTotal}
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.installments}}>
                    <Field
                      component={TextField}
                      name="numParcelas"
                      label="Parcelas"
                      select
                    >
                      {[...Array(12)].map((_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {i + 1}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>

                </Grid>

                {values.numParcelas > 1 && (
                  <Grid container direction="row" spacing={2}>

                    <Grid item size={{xs: 12, sm: 2}}>
                      <Field name="interval">
                        {({ field }) => (
                          <TextField fullWidth label="Período" size="small" variant="filled" select {...field}>
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
                          component={TextField}
                          type="number"
                          name="customDays"
                          label="A cada"
                          InputProps={{ endAdornment: <InputAdornment position="end">dias</InputAdornment> }}
                        />
                      </Grid>
                    )}
                  </Grid>
                )}

                <Grid container direction="row" spacing={2}>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.receiver}}>
                    <Field
                      component={AutoComplete}
                      name="receiver"
                      label="Beneficiário"
                      text={(receiver) => `${receiver.surname}`}
                      onSearch={getPartner}
                      renderSuggestion={(item) => (
                        <span>{item?.surname}</span>
                      )}
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.method}}>
                    <Field
                      component={AutoComplete}
                      name="paymentMethod"
                      label="Forma de pagamento"
                      text={(paymentMethod) => `${paymentMethod.name}`}
                      onSearch={getPaymentMethod}
                      renderSuggestion={(item) => (
                        <span>{item?.name}</span>
                      )}
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.bankAccount}}>
                    <Field
                      component={AutoComplete}
                      name="bankAccount"
                      label="Conta bancária"
                      text={(bankAccount) => `${bankAccount.bank?.name} - ${bankAccount.agency} / ${bankAccount.number}`}
                      onSearch={getBankAccounts}
                      renderSuggestion={(item) => (
                        <span>{item?.bank?.name}</span>
                      )}
                    />
                  </Grid>

                </Grid>

                <Grid container direction="row" spacing={2}>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.company}}>
                    <Field
                      component={AutoComplete}
                      name="company"
                      label="Filial"
                      text={(company) => company?.surname}
                      onSearch={(search) => getCompany(search, 2)}
                      renderSuggestion={(item) => (
                        <span>{item.surname}</span>
                      )}
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.centerCost}}>
                    <Field
                      component={AutoComplete}
                      name="centerCost"
                      label="Centro de custo"
                      text={(centerCost) => centerCost?.description}
                      onSearch={(search) => getCenterCost(search, 2)}
                      renderSuggestion={(item) => (
                        <span>{item.description}</span>
                      )}
                    />
                  </Grid>

                  <Grid item size={{xs: 12, sm: FIELD_SIZE.category}}>
                    <Field
                      component={AutoComplete}
                      name="financialCategory"
                      label="Plano de conta"
                      text={(categorie) => categorie?.description}
                      onSearch={(search) => getFinancialCategory(search, 2)}
                      renderSuggestion={(item) => (
                        <span>{item.description}</span>
                      )}
                    />
                  </Grid>

                </Grid>

                <Grid container direction="row" spacing={2}>
                  <Grid item size={{xs: 12, sm: FIELD_SIZE.description}}>
                    <Field
                      component={TextField}
                      type="text"
                      name="observation"
                      label="Observação"
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>

                {values.numParcelas > 1 && (
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
                            <Field
                              component={NumericField}
                              name={`installments[${index}].amount`}
                              error={Boolean(touched.amount && errors.amount)}
                              helperText={touched.amount && errors.amount}
                            />
                          </TableCell>
                          <TableCell>
                            <Field
                              component={TextField}
                              type="date"
                              name={`installments[${index}].dueDate`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                  </Table>
                )}
                                      
              </DialogContent>
              
              <DialogActions>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting || values.installments.length === 0}
                >
                  {false ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogActions>
          
            </Dialog>
          </Form>
        )
      }} 
    </Formik>
  )
}

const EditInstallment = ({ installmentId, onClose }) => {

  const [loading, setLoading] = useState(false);
  const [installment, setInstallment] = useState(null);

  useEffect(() => {
    const fetchInstallment = async () => {
      setLoading(true);
      try {
        const installment = await getInstallment({ installmentId });
        console.log(installment)
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
    installment: installment?.installment || "",
    partner: installment?.financialMovement?.partner || null,
    centerCost: installment?.financialMovement?.centerCost || null,
    paymentMethod: installment?.paymentMethod || null,
    bankAccount: installment?.bankAccount || null,
    documentNumber: installment?.financialMovement?.documentNumber || "",
    company: installment?.financialMovement?.company || null,
    financialCategory: installment?.financialMovement?.financialCategory || null,
    amount: installment?.amount || 0,
    digitableLine: installment?.boleto?.digitableLine || "",
    issueDate: installment?.financialMovement?.issueDate || "",
    dueDate: installment?.dueDate || "",
    boletoNumber: installment?.boleto?.number || "",
    observation: installment?.observation || "",
  };

  console.log(initialValues)

  const handleSubmit = async (values, actions) => {
    try {
      values.codigo_movimento_detalhe = installmentId;
      values.paymentMethodId = values.paymentMethod?.id || null;
      await submitInstallment(values);
      onClose(true);
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

      <Dialog open={installmentId !== undefined && !loading} onClose={() => onClose(false)} maxWidth={false} slotProps={{ paper: { sx: { position: 'fixed', top: '32px', width: '1100px'}} }}>

        <DialogTitle sx={styles.dialogTitle}>
          Editar pagamento
          <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ values, isSubmitting }) => {

            return (
              <Form>
                <DialogContent>

                  <Grid container direction="row" spacing={2}>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.documentNumber}}>
                      <Field
                        component={TextField}
                        type="text"
                        name="documentNumber"
                        label="Nº Documento"
                        autoFocus
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.issueDate}}>
                      <Field
                        component={TextField}
                        type="date"
                        name="issueDate"
                        label="Emissão"
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.dueDate}}>
                      <Field
                        component={TextField}
                        type="date"
                        name="dueDate"
                        label="Vencimento"
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.scheduledDate}}>
                      <Field
                        component={TextField}
                        type="date"
                        name="Agendamento"
                        label="Agendamento"
                        value={values.scheduledDate ? format(values.scheduledDate, "dd/MM/yyyy") : ''}
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.amountTotal}}>
                      <Field
                        component={NumericField}
                        type="text"
                        name="amount"
                        label="Valor"
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.installments}}>
                      <Field
                        component={TextField}
                        type="text"
                        name="installment"
                        label="Parcela"
                      />
                    </Grid>

                  </Grid>


                  <Grid container direction="row" spacing={2}>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.receiver}}>
                      <Field
                        component={TextField}
                        type="text"
                        name="partner.surname"
                        label="Beneficiário"
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.method}}>
                      <Field
                        component={AutoComplete}
                        name="paymentMethod"
                        label="Forma de pagamento"
                        text={(paymentMethod) => `${paymentMethod.surname}`}
                        onSearch={getPaymentMethod}
                        renderSuggestion={(item) => (
                          <span>{item?.name}</span>
                        )}
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.bankAccount}}>
                      <Field
                        component={AutoComplete}
                        name="bankAccount"
                        label="Conta bancária"
                        text={(bankAccount) => `${bankAccount.bank?.name} - ${bankAccount.agency} / ${bankAccount.number}`}
                        onSearch={getBankAccounts}
                        renderSuggestion={(item) => (
                          <span>{item?.bank?.name}</span>
                        )}
                      />
                    </Grid>

                  </Grid>

                  <Grid container direction="row" spacing={2}>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.company}}>
                      <TextField
                        label="Filial"
                        value={values.company?.surname}
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.centerCost}}>
                      <TextField
                        label="Centro de custo"
                        value={values.centerCost?.description}
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: FIELD_SIZE.category}}>
                      <TextField
                        label="Plano de conta"
                        value={values.financialCategory?.description}
                        readOnly
                      />
                    </Grid>

                  </Grid>

                  <Grid container direction="row" spacing={2}>
                    <Grid item size={{xs: 12, sm: FIELD_SIZE.observation}}>
                      <Field
                        component={TextField}
                        type="text"
                        name="observation"
                        label="Observação"
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>

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
            )
          }}
        </Formik>
      </Dialog>
    </>
  );
}
