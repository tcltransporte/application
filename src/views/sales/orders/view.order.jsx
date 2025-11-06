'use client';

import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, IconButton, Grid, Table, TableHead, TableBody, 
  TableRow, TableCell, CircularProgress, Drawer 
} from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { styles } from "@/components/styles";
import * as orders from "@/app/server/sales/orders";
import { TextField } from "@/components/field";
import { BackdropLoading } from "@/components/BackdropLoading";
import _ from "lodash";

export const ViewOrder = ({ serviceId, onClose }) => {

  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const data = await orders.findOne({ id: serviceId });
        setService(data);
        setItems(data?.services || []); // supondo que venha uma lista de serviços
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) fetchService();
  }, [serviceId]);

  const initialValues = {
    id: service?.id,
    name: service?.name || '',
  };

  const handleSubmit = async (values) => {
    try {
      const updated = await services.upsert({ ...values, services: items });
      onClose(updated);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAddItem = (newItem) => {
    setItems(prev => [...prev, newItem]);
    setOpenDrawer(false);
  };

  return (
    <>
      <BackdropLoading loading={serviceId !== undefined && loading} message={`Carregando...`} />

      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Dialog open={serviceId !== undefined && !loading} onClose={() => onClose(undefined)} maxWidth={'lg'} fullWidth>
            <Form>
              <DialogTitle sx={styles.dialogTitle}>
                {serviceId ? 'Editar' : 'Adicionar'} serviço
                <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                  <i className="ri-close-line" />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto', px: 3 }}>
                <fieldset className="dark-fieldset">
                  <legend>Serviços</legend>

                  {/* === TABELA DE SERVIÇOS === */}
                  <Table size="small" sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Placa</TableCell>
                        <TableCell>Serviço</TableCell>
                        <TableCell>Mecânico</TableCell>
                        <TableCell>Qtda</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Motivo não realizado</TableCell>
                        <TableCell>Local</TableCell>
                        <TableCell>Tipo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 3, opacity: 0.7 }}>
                            Nenhum serviço adicionado
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.status}</TableCell>
                            <TableCell>{row.placa}</TableCell>
                            <TableCell>{row.service?.name}</TableCell>
                            <TableCell>{row.mecanico}</TableCell>
                            <TableCell>{row.qtda}</TableCell>
                            <TableCell>{row.data}</TableCell>
                            <TableCell>{row.motivoNaoRealizado}</TableCell>
                            <TableCell>{row.local}</TableCell>
                            <TableCell>{row.tipo}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {/* Botão Adicionar */}
                  <Button variant="text" startIcon={<i className="ri-add-circle-line" />} sx={{ mt: 2 }} onClick={() => setOpenDrawer(true)}>
                    Adicionar
                  </Button>
                </fieldset>
              </DialogContent>

              <DialogActions sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div></div>
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
          </Dialog>
        )}
      </Formik>

      {/* === DRAWER DE ADIÇÃO === */}
      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)} style={{ zIndex: 1300 }}>
        <div style={{ width: 400, padding: 20 }}>
          <h3>Adicionar Serviço</h3>
          <Formik
            initialValues={{
              status: '',
              placa: '',
              servico: '',
              mecanico: '',
              qtda: '',
              data: '',
              motivoNaoRealizado: '',
              local: '',
              tipo: ''
            }}
            onSubmit={(values, { resetForm }) => {
              handleAddItem(values);
              resetForm();
            }}
          >
            {({ handleSubmit }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item size={12}>
                    <Field name="status" label="Status" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="placa" label="Placa" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="servico" label="Serviço" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="mecanico" label="Mecânico" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="qtda" label="Quantidade" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="data" label="Data" type="date" component={TextField} fullWidth InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item size={12}>
                    <Field name="motivoNaoRealizado" label="Motivo não realizado" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="local" label="Local" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={6}>
                    <Field name="tipo" label="Tipo" component={TextField} fullWidth />
                  </Grid>
                  <Grid item size={12} sx={{ textAlign: 'right', mt: 2 }}>
                    <Button onClick={() => setOpenDrawer(false)} sx={{ mr: 1 }}>Cancelar</Button>
                    <Button type="submit" variant="contained">Adicionar</Button>
                    
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </div>
      </Drawer>
    </>
  );
};
