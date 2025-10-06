'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Grid, InputAdornment, Checkbox, RadioGroup, FormControlLabel, Radio, Card, CardHeader, CardContent, Autocomplete, Box } from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Backdrop, CircularProgress } from "@mui/material";
import { AutoComplete } from "@/components/field/AutoComplete";
import { styles } from "@/components/styles";
import * as shippiments from "@/app/server/expedition/shippiments/index.controller";
import { getCompany, getFinancialCategory, getPartner, getPaymentMethod } from "@/utils/search";
import { addDays, addMonths, format } from "date-fns";

import { NumericField, TextField } from "@/components/field";
import { BackdropLoading } from "@/components/BackdropLoading";
import _ from "lodash";

export const ViewShippiment = ({ shippimentId, onClose }) => {

  const [loading, setLoading] = useState(false);
  const [installment, setInstallment] = useState(null);

  const [nfes, setNfes] = useState([]);
  const [selectedNotas, setSelectedNotas] = useState([]);

  useEffect(() => {

    setNfes([])
    
    const fetchInstallment = async () => {
      setLoading(true);
      try {

        //const installment = await shippiments.findOne({ shippimentId })

        //setInstallment(installment);

      } catch (error) {
        setErrorState(error);
      } finally {
        setLoading(false);
      }
    };

    if (shippimentId) {
      fetchInstallment();
    }

    //fetchNfes()

  }, [shippimentId]);


  const fetchNfes = async ({senderId}) => {

    const nfes = await shippiments.nfes({senderId})

    setNfes(nfes)

  }

  const handleToggle = (codigoNota, values, setFieldValue) => {
    let updated;
    if (selectedNotas.includes(codigoNota)) {
      updated = selectedNotas.filter((id) => id !== codigoNota);
    } else {
      updated = [...selectedNotas, codigoNota];
    }
    setSelectedNotas(updated);
    setFieldValue("nfes", updated); // sincroniza com Formik
  };


  const initialValues = {
    sender: null, //installment?.financialMovement?.partner || null,
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

      await shippiments.create({
        senderId: values.sender.codigo_pesoa,
        nfes: values.nfes
      })

      console.log(values)
      //values.codigo_movimento_detalhe = shippimentId;
      //values.paymentMethodId = values.paymentMethod?.id || null;
      //await payments.update(values);
      //onClose(true);
    } catch (error) {
      //console.error(error.message);
      //actions.setSubmitting(false);
    }
  };

  return (
    <>
      <BackdropLoading loading={shippimentId !== undefined && loading} message={`Carregando...`} />

        <Formik
          initialValues={initialValues}
          //enableReinitialize
          //validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting }) => {

            return (
              <Dialog open={shippimentId !== undefined && !loading} onClose={() => onClose(false)} maxWidth={'lg'}>

                <Form>
  
                  <DialogTitle sx={styles.dialogTitle}>
                    {shippimentId ? 'Editar' : 'Adicionar'} romaneio
                    <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                      <i className="ri-close-line" />
                    </IconButton>
                  </DialogTitle>

                  <DialogContent
                    sx={{
                      maxHeight: '80vh', // Altura máxima do conteúdo
                      overflowY: 'auto', // Scroll apenas aqui
                      px: 3,
                    }}>

                    <fieldset className="dark-fieldset">

                      <legend>Informações</legend>

                      <Grid container direction="row" spacing={2}>

                        <Grid item size={{xs: 12, sm: 2.2}}>
                          <Field
                            component={TextField}
                            label="Doc. Transporte"
                            type="text"
                            name="description"
                          />
                        </Grid>
                          
                        <Grid item size={{xs: 12, sm: 4.9}}>
                          <Field
                            component={AutoComplete}
                            name="sender"
                            label="Remetente"
                            text={(sender) => `${sender.surname}`}
                            onSearch={getPartner}
                            renderSuggestion={(item) => (
                              <span>{item?.surname}</span>
                            )}
                            onChange={(sender) => {
                              console.log(sender)
                              fetchNfes({senderId: sender?.codigo_pessoa})
                            }}
                          />
                        </Grid>

                        <Grid item size={{xs: 12, sm: 4.9}}>
                          <Field
                            component={TextField}
                            label="Produto predominante"
                            type="text"
                            name="predominant"
                          />
                        </Grid>

                        <Grid item size={{xs: 12, sm: 4}}>
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

                        <Grid item size={{xs: 12, sm: 8}}>
                          <Field
                            component={TextField}
                            label="Descrição"
                            type="text"
                            name="predominant"
                          />
                        </Grid>

                      </Grid>

                    </fieldset>
                 
                    <fieldset className="dark-fieldset">

                      <legend>Seguro</legend>
                      
                      <Grid container spacing={3}>
                        {/* Responsável */}
                        <Grid item size={{xs: 12, md: 4}}>
                          <Autocomplete
                            //options={responsaveis}
                            //value={responsavel}
                            //onChange={(_, newValue) => setResponsavel(newValue)}
                            renderInput={(params) => (
                              <TextField {...params} label="Responsável" fullWidth />
                            )}
                          />
                        </Grid>

                        {/* Seguradora */}
                        <Grid item size={{xs: 12, md: 4}}>
                          <Autocomplete
                            //options={seguradoras}
                            //value={seguradora}
                            //onChange={(_, newValue) => setSeguradora(newValue)}
                            renderInput={(params) => (
                              <TextField {...params} label="Seguradora" fullWidth />
                            )}
                          />
                        </Grid>

                        {/* Número da Apólice */}
                        <Grid item size={{xs: 12, md: 4}}>
                          <TextField
                            label="Número da Apólice"
                            //value={numeroApolice}
                            //onChange={(e) => setNumeroApolice(e.target.value)}
                            fullWidth
                            inputProps={{ maxLength: 20 }}
                          />
                        </Grid>
                      </Grid>

                    </fieldset>

                    
                    <fieldset className="dark-fieldset">

                      <legend>Serviço</legend>
                      
                      <Grid container spacing={3}>
                        {/* Responsável */}
                        <Grid item size={{xs: 12, md: 2.2}}>
                          <Autocomplete
                            //options={responsaveis}
                            //value={responsavel}
                            //onChange={(_, newValue) => setResponsavel(newValue)}
                            renderInput={(params) => (
                              <TextField {...params} label="Tipo de serviço" fullWidth />
                            )}
                          />
                        </Grid>

                        {/* Seguradora */}
                        <Grid item size={{xs: 12, md: 4.9}}>
                          <Autocomplete
                            //options={seguradoras}
                            //value={seguradora}
                            //onChange={(_, newValue) => setSeguradora(newValue)}
                            renderInput={(params) => (
                              <TextField {...params} label="Expedidor" fullWidth />
                            )}
                          />
                        </Grid>

                        {/* Número da Apólice */}
                        <Grid item size={{xs: 12, md: 4.9}}>
                          <TextField
                            label="Recebedor"
                            //value={numeroApolice}
                            //onChange={(e) => setNumeroApolice(e.target.value)}
                            fullWidth
                            inputProps={{ maxLength: 20 }}
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={3}>
                        {/* Responsável */}
                        <Grid item size={{xs: 12, md: 2.2}}>
                          <Autocomplete
                            //options={responsaveis}
                            //value={responsavel}
                            //onChange={(_, newValue) => setResponsavel(newValue)}
                            renderInput={(params) => (
                              <TextField {...params} label="Tomador do serviço" fullWidth />
                            )}
                          />
                        </Grid>

                        {/* Seguradora */}
                        <Grid item size={{xs: 12, md: 4.9}}>
                          <Autocomplete
                            //options={seguradoras}
                            //value={seguradora}
                            //onChange={(_, newValue) => setSeguradora(newValue)}
                            renderInput={(params) => (
                              <TextField {...params} label="Tomador" fullWidth />
                            )}
                          />
                        </Grid>

                        {/* Número da Apólice */}
                        <Grid item size={{xs: 12, md: 4.9}}>
                          <TextField
                            label="Chave do CT-e emitido pelo Tomador"
                            //value={numeroApolice}
                            //onChange={(e) => setNumeroApolice(e.target.value)}
                            fullWidth
                            inputProps={{ maxLength: 20 }}
                          />
                        </Grid>
                      </Grid>

                    </fieldset>

                    
                    <fieldset className="dark-fieldset">

                      <legend>Notas fiscais</legend>

                        <Table size="small" sx={{ mt: 5 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell></TableCell>
                              <TableCell>Emissão</TableCell>
                              <TableCell>Número</TableCell>
                              <TableCell>Serie</TableCell>
                              <TableCell>Remetente</TableCell>
                              <TableCell>Destinatário</TableCell>
                              <TableCell align="right">Peso</TableCell>
                              <TableCell align="right">Valor</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {nfes.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    color="primary"
                                    checked={selectedNotas.includes(item.codigo_nota)}
                                    onChange={() => handleToggle(item.codigo_nota, values, setFieldValue)}
                                  />
                                </TableCell>
                                <TableCell>{format(item.emission, 'dd/MM/yyyy HH:mm')}</TableCell>
                                <TableCell>{item.nNF}</TableCell>
                                <TableCell>{item.serie}</TableCell>
                                <TableCell>{item.sender?.surname}</TableCell>
                                <TableCell>{item.destination?.surname}</TableCell>
                                <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(item.weight)}</TableCell>
                                <TableCell align="right">{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>

                        </Table>
                    
                    </fieldset>

                  </DialogContent>

                  <DialogActions sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* Radios à esquerda */}
                    <RadioGroup
                      row
                      name="tipoAgrupamento"
                      defaultValue="agrupar"
                      sx={{ ml: 1 }}
                    >
                      <FormControlLabel
                        value="agrupar"
                        control={<Radio />}
                        label="Agrupar todos"
                        disabled={_.size(selectedNotas) == 0}
                      />
                      <FormControlLabel
                        value="separar"
                        control={<Radio />}
                        label="Separar por destinatário"
                        disabled={_.size(selectedNotas) == 0}
                      />
                    </RadioGroup>

                    {/* Botão à direita */}
                    <Button type="submit" variant="contained" disabled={_.size(selectedNotas) == 0 || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                          Confirmando...
                        </>
                      ) : (
                        "Confimar"
                      )}
                    </Button>
                  </DialogActions>

                </Form>
              </Dialog>
            )
          }}
        </Formik>
    </>
  );
}
