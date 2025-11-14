'use client';

import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Grid, Table, TableHead,
  TableBody, TableRow, TableCell, CircularProgress, Box, InputAdornment, TextField, Typography,
  RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import { styles } from "@/components/styles";

import { AutoComplete, NumericField } from "@/components/field";
import { BackdropLoading } from "@/components/BackdropLoading";

import * as orders from "@/app/server/sales/orders";
import * as search from '@/utils/search';
import { Drawer } from "@/components/Drawer";

import { upsertByIndex } from "@/utils/arrayUtils";
import _ from "lodash";
import Swal from "sweetalert2";
import { useSession } from 'next-auth/react';
import { keyframes } from "@emotion/react"

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
`

export const StatusField = ({ label = "Status", value = "Ativo" }) => {
  const getColor = (status) => {
    switch (status?.toLowerCase()) {
      case "ativo":
      case "concluído":
      case "aprovado":
        return "#4caf50" // verde
      case "pendente":
      case "em andamento":
        return "#ff9800" // laranja
      case "cancelado":
      case "reprovado":
        return "#f44336" // vermelho
      default:
        return "#9e9e9e" // cinza
    }
  }

  const color = getColor(value)

  return (
    <TextField
      fullWidth
      variant="filled"
      label={label}
      value={value}
      InputProps={{
        readOnly: true,
        startAdornment: (
          <InputAdornment position="start">
            <Box
              sx={{
                position: "relative",
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: color,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  backgroundColor: color,
                  animation: `${pulse} 1.4s infinite ease-in-out`,
                },
              }}
            />
          </InputAdornment>
        ),
      }}
    />
  )
}

export const ViewOrder = ({ serviceId, onClose }) => {

  const session = useSession();

  const empty = {
    company: session.data?.company,
    locality: session.data?.company?.city,
    customer: null,
    takerType: "customer", // 👈 padrão: tomador = cliente
    taker: null,
    name: '',
    services: []
  };

  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);
  const [editingService, setEditingService] = useState(undefined);

  useEffect(() => {

    if (!serviceId) {
      setService(empty);
      return;
    }

    const fetchService = async () => {
      setLoading(true);
      try {
        const data = await orders.findOne({ id: serviceId });
        setService(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();

  }, [serviceId]);

  const handleSubmit = async (values) => {
    try {
      const updated = await orders.upsert(values);
      onClose(updated);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAddItem = (item, index) => {
    setService(prev => ({ ...prev, services: upsertByIndex(prev.services || [], item, index) }));
    setEditingService(undefined);
  };

  const handleRemoveItem = async (index) => {

    const result = await Swal.fire({
      text: 'Tem certeza que deseja excluir ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    });

    if (result.isConfirmed) {
      setService(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
    }

  };

  return (
    <>
      <BackdropLoading loading={serviceId !== undefined && loading} message="Carregando..." />

      <Formik
        initialValues={service || empty}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, isSubmitting, values }) => (
          <Dialog open={serviceId !== undefined && !loading} onClose={() => onClose(undefined)} maxWidth="lg" fullWidth>
            <Form>

              <DialogTitle sx={styles.dialogTitle}>
                {serviceId ? 'Editar' : 'Adicionar'} serviço
                <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                  <i className="ri-close-line" />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto', px: 3 }}>
                <Grid container spacing={2} alignItems="center">

                  <Grid item size={{ sm: 12, md: 1.5 }}>
                    <Field component={TextField} name="phone" label="Número" />
                  </Grid>
                  <Grid item size={{ sm: 12, md: 1.7 }}>
                    <Field component={TextField} name="date" label="Data" />
                  </Grid>
                  <Grid item size={{ sm: 12, md: 4 }}>
                    <Field
                      component={AutoComplete}
                      name="company"
                      label="Filial"
                      text={(company) => company.surname}
                      onSearch={(value) => search.company(value)}
                      renderSuggestion={(item) => <span>{item.surname}</span>}
                      onChange={(company) => {
                        setFieldValue("company", company);
                        setFieldValue("locality", company?.city || null);
                      }}
                    />
                  </Grid>
                  <Grid item size={{ sm: 12, md: 2.5 }}>
                    <Field
                      component={AutoComplete}
                      name="locality"
                      label="Localidade"
                      text={(locality) => `${locality.name} - ${locality.state?.acronym}`}
                      onSearch={(value) => search.city(value)}
                      renderSuggestion={(item) => <span>{item.name} - {item.state?.acronym}</span>}
                    />
                  </Grid>
                  <Grid item size={{ sm: 12, md: 2.3 }}>
                    <StatusField></StatusField>
                  </Grid>
                </Grid>

                {/* Cliente e Tomador */}
                <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  {/* Cliente */}
                  <Grid item size={{ sm: 12, md: 4.4 }}>
                    <Field
                      component={AutoComplete}
                      name="customer"
                      label="Cliente"
                      text={(partner) => partner?.surname}
                      onSearch={(value) => search.partner(value)}
                      renderSuggestion={(item) => <span>{item.surname}</span>}
                      onChange={(partner) => {
                        setFieldValue("customer", partner);
                        if (values.takerType === "customer") {
                          setFieldValue("taker", partner);
                        }
                      }}
                    />
                  </Grid>

                  <Grid item size={{ sm: 12, md: 2.8 }}>
                    <Field
                      component={AutoComplete}
                      name="company"
                      label="Vendedor"
                      text={(company) => company.surname}
                      onSearch={(value) => search.company(value)}
                      renderSuggestion={(item) => <span>{item.surname}</span>}
                    />
                  </Grid>

                </Grid>

                <Button
                  variant="text"
                  startIcon={<i className="ri-add-circle-line" />}
                  sx={{ mt: 2 }}
                >
                  Intermediário
                </Button>

                <br /><br /><br />

                {/* Serviços */}
                <fieldset className="dark-fieldset">
                  <legend>Serviços</legend>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item size={{ sm: 12, md: 4.4 }}>
                      <Field
                        component={AutoComplete}
                        name="company"
                        label="Tributação"
                        text={(company) => company.surname}
                        onSearch={(value) => search.company(value)}
                        renderSuggestion={(item) => <span>{item.surname}</span>}
                      />
                    </Grid>
                  </Grid>

                  <Table size="small" sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Descrição</TableCell>
                        <TableCell align='right' sx={{ width: 80 }}>Valor</TableCell>
                        <TableCell align='right' sx={{ width: 100 }}>Aliq ISSQN</TableCell>
                        <TableCell align='right' sx={{ width: 100 }}>Valor ISSQN</TableCell>
                        <TableCell sx={{ width: 60 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {values.services?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, opacity: 0.7 }}>
                            Nenhum serviço adicionado
                          </TableCell>
                        </TableRow>
                      ) : (
                        values.services.map((row, index) => (
                          <TableRow key={index} onDoubleClick={() => setEditingService({ ...row, index })} style={{ cursor: "pointer" }}>
                            <TableCell>{row.service?.name}</TableCell>
                            <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(row.amount)}</TableCell>
                            <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(row.pISSQN)}</TableCell>
                            <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(row.vISSQN)}</TableCell>
                            <TableCell width={40}>
                              <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}>
                                <i className="ri-delete-bin-line" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <Button
                    variant="text"
                    startIcon={<i className="ri-add-circle-line" />}
                    sx={{ mt: 2 }}
                    onClick={() => setEditingService({ index: null })}
                  >
                    Adicionar serviço
                  </Button>
                </fieldset>
              </DialogContent>

              <DialogActions sx={{ justifyContent: "flex-end" }}>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <><CircularProgress size={20} color="inherit" />&nbsp;&nbsp;Salvando</> : "Salvar"}
                </Button>
              </DialogActions>

            </Form>
          </Dialog>
        )}
      </Formik>

      <ServiceItemFormDrawer
        service={editingService}
        onClose={() => setEditingService(undefined)}
        onSubmit={handleAddItem}
      />
      
    </>
  );
};

export function ServiceItemFormDrawer({ service, onClose, onSubmit }) {

  const initialValues = {
    id: service?.id,
    service: service?.service || null,
    amount: service?.amount || 0,
    pISSQN: service?.pISSQN || 0,
    vISSQN: service?.vISSQN || 0
  }

  return (
    <Drawer open={service !== undefined} title={service?.index != null ? "Editar Serviço" : "Adicionar Serviço"} width={"600px"} onClose={onClose}>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={(values) => onSubmit(values, service?.index)}
      >
        {({ values, setFieldValue }) => {

          const handleChangeAliq = (aliq) => {
            const amount = parseFloat(values.amount || 0)
            const newAliq = parseFloat(aliq || 0)
            const vISSQN = amount > 0 ? (amount * newAliq) / 100 : 0
            setFieldValue('pISSQN', newAliq)
            setFieldValue('vISSQN', vISSQN)
          }

          const handleChangeValor = (valor) => {
            const amount = parseFloat(values.amount || 0)
            const vISSQN = parseFloat(valor || 0)
            const aliq = amount > 0 ? (vISSQN / amount) * 100 : 0
            setFieldValue('vISSQN', vISSQN)
            setFieldValue('pISSQN', aliq)
          }

          return (
            <Form>
              <Grid container spacing={2}>

                <Grid item size={{ sm: 12, md: 12 }}>
                  <Field
                    component={AutoComplete}
                    name="service"
                    label="Serviço"
                    text={(s) => s?.name}
                    onSearch={(value) => search.service(value)}
                    renderSuggestion={(item) => <span>{item.name}</span>}
                  />
                </Grid>

                <Grid item size={{ sm: 12, md: 4 }}>
                  <Field name="amount" label="Valor" component={NumericField} />
                </Grid>

                <Grid item size={{ sm: 12, md: 4 }}>
                  <Field
                    name="pISSQN"
                    label="Aliq ISSQN (%)"
                    component={NumericField}
                    onChange={(pISSQN) => handleChangeAliq(pISSQN)}
                  />
                </Grid>

                <Grid item size={{ sm: 12, md: 4 }}>
                  <Field
                    name="vISSQN"
                    label="Valor ISSQN"
                    component={NumericField}
                    onChange={(vISSQN) => handleChangeValor(vISSQN)}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  container
                  spacing={1}
                  sx={{ mt: 2 }}
                  justifyContent="flex-end"
                >
                  <Grid item>
                    <Button onClick={onClose}>Cancelar</Button>
                  </Grid>
                  <Grid item>
                    <Button type="submit" variant="contained">
                      {service?.index != null ? "Salvar" : "Adicionar"}
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Form>
          )
        }}
      </Formik>

    </Drawer>
  );
}
