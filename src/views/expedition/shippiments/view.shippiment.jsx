'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Grid, InputAdornment } from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress } from "@mui/material";
import { AutoComplete } from "@/components/field/AutoComplete";
import { styles } from "@/components/styles";
import { createMovement, getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { getFinancialCategory, getPartner, getPaymentMethod } from "@/utils/search";
import { addDays, addMonths, format } from "date-fns";

import { NumericField, TextField } from "@/components/field";

export const ViewShippiment = ({ shippimentId, onClose }) => {

  const [loading, setLoading] = useState(false);
  const [installment, setInstallment] = useState(null);

  useEffect(() => {
    
    const fetchInstallment = async () => {
      setLoading(true);
      try {
        const installment = await getInstallment({ shippimentId });
        console.log(installment)
        setInstallment(installment);
      } catch (error) {
        setErrorState(error);
      } finally {
        setLoading(false);
      }
    };

    if (shippimentId) {
      fetchInstallment();
    }
  }, [shippimentId]);

  const initialValues = {
    partner: installment?.financialMovement?.partner || null,
    paymentMethod: installment?.paymentMethod || null,
    documentNumber: installment?.financialMovement?.documentNumber || "",
    amount: installment?.amount || 0,
    digitableLine: installment?.boleto?.digitableLine || "",
    dueDate: installment?.dueDate || "",
    boletoNumber: installment?.boleto?.number || "",
    description: installment?.description || "",
  };

  const handleSubmit = async (values, actions) => {
    try {
      values.codigo_movimento_detalhe = shippimentId;
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
    
      <Backdrop open={shippimentId !== undefined && loading} sx={{ zIndex: 1200, color: "#fff", flexDirection: "column" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2, color: "#fff" }}>
          Carregando...
        </Typography>
      </Backdrop>

      <Dialog open={shippimentId !== undefined && !loading} onClose={() => onClose(false)} maxWidth={false} slotProps={{ paper: { sx: {position: 'fixed', top: '32px', width: '750px'}} }}>

        <DialogTitle sx={styles.dialogTitle}>
          {shippimentId ? 'Editar' : 'Adicionar'} romaneio
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
          {({ values, setFieldValue, isSubmitting }) => {

            console.log(values)

            return (
              <Form>
                <DialogContent>

                  <Grid container direction="row" spacing={2}>

                    <Grid item size={{xs: 12, sm: 6}}>
                      <TextField
                        label="Doc. Transporte"
                        value={values.partner?.surname}
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: 6}}>
                      <AutoComplete
                        name="sender"
                        label="Remetente"
                        value={values.paymentMethod}
                        text={(p) => p?.name}
                        onChange={(val) => setFieldValue("sender", val)}
                        onSearch={getPartner}
                      >
                        {(item) => <span>{item.name}</span>}
                      </AutoComplete>
                    </Grid>
                  </Grid>

                  <Grid container direction="row" spacing={2}>

                    <Grid item size={{xs: 12, sm: 3}}>
                      <TextField
                        label="Nº Documento"
                        value={values.documentNumber}
                        readOnly
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: 3}}>
                      <Field
                        type="date"
                        name="issueDate"
                        label="Emissão"
                        component={TextField}
                      />
                    </Grid>

                    <Grid item size={{xs: 12, sm: 3}}>
                      <Field
                        type="date"
                        name="dueDate"
                        label="Vencimento"
                        component={TextField}
                      />
                    </Grid>
                  </Grid>

                  <Grid container direction="row" spacing={2}>
                    <Grid item size={{xs: 12, sm: 12}}>
                      <Field
                        type="text"
                        name="description"
                        label="Descrição"
                        component={TextField}
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
