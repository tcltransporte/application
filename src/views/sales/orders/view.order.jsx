'use client';

import { useEffect, useState } from "react";
import {  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Grid, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from "@mui/material";
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

export const ViewOrder = ({ serviceId, onClose }) => {

  const [loading, setLoading] = useState(false)
  const [service, setService] = useState(null)
  const [editingService, setEditingService] = useState(undefined)

  useEffect(() => {

    if (!serviceId) {
      setService({ customer: null, name: '', services: [] })
      return;
    }

    const fetchService = async () => {
      setLoading(true)
      try {
        const data = await orders.findOne({ id: serviceId })
        setService(data || { customer: null, name: '', services: [] })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchService()

  }, [serviceId])

  const handleSubmit = async (values) => {
    try {
      const updated = await orders.upsert(values);
      onClose(updated);
    } catch (error) {
      console.error(error.message);
    }
  }

  const handleAddItem = (item, index) => {
    setService(prev => ({ ...prev, services: upsertByIndex(prev.services || [], item, index) }))
    setEditingService(undefined)
  }

  const handleRemoveItem = async (index) => {

    const result = await Swal.fire({ text: 'Tem certeza que deseja excluir ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' })
    
    if (result.isConfirmed) {
      setService(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }))
    }

  }

  return (
    <>
      <BackdropLoading loading={serviceId !== undefined && loading} message="Carregando..." />

      <Formik
        initialValues={service || { customer: null, name: '', services: [] }}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values }) => (
          <Dialog open={serviceId !== undefined && !loading} onClose={() => onClose(undefined)} maxWidth="lg" fullWidth>
            <Form>

              <DialogTitle sx={styles.dialogTitle}>
                {serviceId ? 'Editar' : 'Adicionar'} serviço
                <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                  <i className="ri-close-line" />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto', px: 3 }}>

                <Field
                  component={AutoComplete}
                  name="customer"
                  label="Cliente"
                  text={(partner) => partner.surname}
                  onSearch={(value) => search.partner(value)}
                  renderSuggestion={(item) => <span>{item.surname}</span>}
                />

                <br />

                <fieldset className="dark-fieldset">
                  <legend>Serviços</legend>

                  <Table size="small" sx={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Serviço</TableCell>
                        <TableCell align='right' sx={{ width: 80 }}>Valor</TableCell>
                        <TableCell align='right' sx={{ width: 100 }}>Aliq ISSQN</TableCell>
                        <TableCell align='right' sx={{ width: 100 }}>Valor ISSQN</TableCell>
                        <TableCell></TableCell>
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
                            <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.amount)}</TableCell>
                            <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.issqn)}</TableCell>
                            <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.issqnValue)}</TableCell>
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
                    Adicionar
                  </Button>
                </fieldset>
              </DialogContent>

              <DialogActions sx={{ justifyContent: "flex-end" }}>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Salvar"}
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
  )

}

export function ServiceItemFormDrawer({ service, onClose, onSubmit }) {

  const initialValues = {
    service: service?.service || null,
    amount: service?.amount || '',
    issqn: service?.issqn || '',
    issqnValue: service?.issqnValue || ''
  };

  return (
    <Drawer open={service !== undefined} title={service?.index != null ? "Editar Serviço" : "Adicionar Serviço"} width={"600px"} onClose={onClose}>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={(values) => {
          onSubmit(values, service?.index)
        }}
      >
        <Form>
          <Grid container spacing={2}>

            <Grid item xs={12}>
              <Field
                component={AutoComplete}
                name="service"
                label="Serviço"
                text={(s) => s?.name}
                onSearch={(value) => search.service(value)}
                renderSuggestion={(item) => <span>{item.name}</span>}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Field name="amount" label="Valor" component={NumericField} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Field name="issqn" label="Aliq ISSQN" component={NumericField} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Field name="issqnValue" label="Valor ISSQN" component={NumericField} />
            </Grid>

            <Grid container item xs={12} sx={{ mt: 2 }} justifyContent="flex-end" spacing={1}>
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
      </Formik>
    </Drawer>
  );
}
