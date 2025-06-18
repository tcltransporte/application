import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress, TextField } from "@mui/material";
import { AutoComplete } from "@/components/AutoComplete";
import { styles } from "@/components/styles";
import { getInstallment, submitInstallment } from "@/app/server/finances/payments/view.payment-installment.controller";
import { getPaymentMethod } from "@/utils/search";

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

export const NewInstallmentModal = ({ installmentId, onClose }) => {
  const [parcelas, setParcelas] = useState([]);

  const [newParcela, setNewParcela] = useState({
    amount: "",
    dueDate: "",
    digitableLine: "",
    boletoNumber: "",
  });

  const handleChange = (e) => {
    setNewParcela({ ...newParcela, [e.target.name]: e.target.value });
  };

  const handleAddParcela = () => {
    if (!newParcela.amount || !newParcela.dueDate) return;
    setParcelas([...parcelas, newParcela]);
    setNewParcela({ amount: "", dueDate: "", digitableLine: "", boletoNumber: "" });
  };

  const handleRemoveParcela = (index) => {
    const updated = [...parcelas];
    updated.splice(index, 1);
    setParcelas(updated);
  };

  const handleSubmit = async () => {
    // Aqui você envia `parcelas` para API ou lógica do movimento
    console.log("Movimento criado com parcelas:", parcelas);
    onClose(parcelas); // Ou retorne como quiser
  };

  return (
    <Dialog open={installmentId == null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={styles.dialogTitle}>
        Novo Lançamento
        <IconButton aria-label="close" onClick={onClose} sx={styles.dialogClose}>
          <i className="ri-close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>Adicionar Parcela</Typography>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <TextField
            label="Valor"
            name="amount"
            type="number"
            size="small"
            value={newParcela.amount}
            onChange={handleChange}
          />
          <TextField
            label="Data de Vencimento"
            name="dueDate"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={newParcela.dueDate}
            onChange={handleChange}
          />
          <TextField
            label="Linha Digitável"
            name="digitableLine"
            size="small"
            value={newParcela.digitableLine}
            onChange={handleChange}
          />
          <TextField
            label="Nosso Número"
            name="boletoNumber"
            size="small"
            value={newParcela.boletoNumber}
            onChange={handleChange}
          />
          <Button variant="outlined" onClick={handleAddParcela} sx={{ height: 40 }}>
            Adicionar
          </Button>
        </div>

        <Typography variant="subtitle1" sx={{ mt: 3 }}>Parcelas Adicionadas</Typography>
        {parcelas.length > 0 ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Valor</TableCell>
                <TableCell>Vencimento</TableCell>
                <TableCell>Linha Digitável</TableCell>
                <TableCell>Nosso Número</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parcelas.map((parcela, index) => (
                <TableRow key={index}>
                  <TableCell>R$ {Number(parcela.amount).toFixed(2)}</TableCell>
                  <TableCell>{parcela.dueDate}</TableCell>
                  <TableCell>{parcela.digitableLine}</TableCell>
                  <TableCell>{parcela.boletoNumber}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleRemoveParcela(index)} size="small">
                      <i className="ri-delete-bin-line" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography sx={{ mt: 1 }}>Nenhuma parcela adicionada ainda.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={handleSubmit} disabled={parcelas.length === 0}>
          Criar Movimento
        </Button>
      </DialogActions>
    </Dialog>
  );
};


// Exemplo básico do modal de novo lançamento
const NewInstallmentModal2 = ({ installmentId, onClose }) => {
  const handleSubmit = async () => {
    // lógica para criar um movimento com parcelas
    onClose(); // retorne dados se necessário
  };

  return (
    <Dialog open={installmentId == null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={styles.dialogTitle}>
        Novo Lançamento
        <IconButton aria-label="close" onClick={onClose} sx={styles.dialogClose}>
          <i className="ri-close-line" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Aqui você colocaria os campos do novo lançamento (ex: número de parcelas, valor total etc.) */}
        <Typography>Formulário de criação de novo movimento com parcelas</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} variant="contained">
          Criar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
