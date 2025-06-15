import { getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { AutoComplete } from "@/components/AutoComplete";
import { styles } from "@/components/styles";
import { getPaymentMethod } from "@/utils/search";
import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Formik, Form } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";

export const ViewPaymentInstallment = ({ installmentId, onClose }) => {
  const theme = useTheme();

  const [errorState, setErrorState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [installment, setInstallment] = useState(null);

  useEffect(() => {
    const fetchInstallment = async () => {
      try {
        setErrorState(null);
        setLoading(true);

        if (installmentId) {
          const payment = await getInstallment({ installmentId });
          setInstallment(payment);
        }
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

  const validationSchema = Yup.object({
    // amount: Yup.number().min(0, "Valor inválido").required("Obrigatório"),
    // paymentMethod: Yup.object().nullable().required("Forma de pagamento obrigatória"),
  });

  const handleSubmit = async (values) => {
    values.codigo_movimento_detalhe = installmentId;
    values.paymentMethodId = values.paymentMethod?.id || null;
    const installment = await submitInstallment(values);
    onClose(installment);
  };

  return (
    <>
      <Backdrop
        open={loading}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 1, color: "#fff", flexDirection: "column" }}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2, color: "#fff" }}>
          Carregando...
        </Typography>
      </Backdrop>

      <Dialog
        open={installmentId !== undefined && !loading}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={styles.dialogTitle}>
          Editar
          <IconButton aria-label="close" onClick={() => onClose()} sx={styles.dialogClose} size="large">
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
            <Form>
              <DialogContent>
                <AutoComplete
                  name="paymentMethod"
                  size="small"
                  label="Forma de pagamento"
                  value={values.paymentMethod}
                  text={(paymentMethod) => paymentMethod?.name}
                  onChange={(paymentMethod) => {
                    setFieldValue("paymentMethod", paymentMethod);
                  }}
                  onSearch={getPaymentMethod}
                  error={touched.paymentMethod && Boolean(errors.paymentMethod)}
                  helperText={touched.paymentMethod && errors.paymentMethod}
                >
                  {(item) => <span>{item.name}</span>}
                </AutoComplete>

                <TextField
                  label="Linha digitável"
                  fullWidth
                  margin="dense"
                  size="small"
                  name="digitableLine"
                  value={values.digitableLine}
                  onChange={handleChange}
                />

                <TextField
                  label="Data de vencimento"
                  type="date"
                  fullWidth
                  margin="dense"
                  size="small"
                  name="dueDate"
                  InputLabelProps={{ shrink: true }}
                  value={values.dueDate}
                  onChange={handleChange}
                />

                <TextField
                  label="Nosso número / Nº do boleto"
                  fullWidth
                  margin="dense"
                  size="small"
                  name="boletoNumber"
                  value={values.boletoNumber}
                  onChange={handleChange}
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
