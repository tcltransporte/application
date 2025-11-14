'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab,
  Box,
  CircularProgress
} from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field, useFormikContext } from "formik";
import { styles } from "@/components/styles";
import * as partners from "@/app/server/register/partner";
import * as search from "@/utils/search";

import { AutoComplete, SelectField, TextField } from "@/components/field";
import { BackdropLoading } from "@/components/BackdropLoading";
import _ from "lodash";
import Swal from "sweetalert2";


// ------------------ CEP FIELD ------------------
const CepField = () => {
  const { values, setFieldValue } = useFormikContext();

  const handleSearch = async () => {
    const cep = values.zipCode?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;

    const data = await buscarEnderecoPeloCep(cep);

    if (!data?.erro) {
      setFieldValue('address.street', data.logradouro || '');
      setFieldValue('address.district', data.bairro || '');
      setFieldValue('address.city', data.localidade || '');
      setFieldValue('address.city.state', data.uf || '');
    }
  };

  return (
    <Field
      component={TextField}
      label="CEP"
      name="address.zipCode"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onMouseDown={handleSearch}>
                <i className="ri-map-pin-2-line" style={{ fontSize: 20 }} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};


// ------------------ COMPONENTE PRINCIPAL ------------------
export const ViewService = ({ partnerId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [tab, setTab] = useState(0); // aba ativa

  useEffect(() => {

    const fetchService = async () => {
      setLoading(true);
      try {
        const partner = await partners.findOne({ id: partnerId });
        setPartner(partner);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (partnerId) {
      fetchService();
    } else {
      setPartner(null);
    }

  }, [partnerId]);

  const initialValues = {
    codigo_pessoa: partner?.codigo_pessoa,
    typeId: partner?.typeId ?? 2,
    cpfCnpj: partner?.cpfCnpj ?? '',
    surname: partner?.surname ?? '',
    name: partner?.name ?? '',
    address: {
      ...partner?.address,
      city: {
        ...partner?.address?.city,
        state: partner?.address?.city?.state ?? null, // 👈 garante que o campo existe
      },
    },
  };

  const handleSubmit = async (values) => {
    try {
      const partner = await partners.upsert(values);
      onClose(partner);
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <>
      <BackdropLoading loading={partnerId !== undefined && loading} message={`Carregando...`} />

      <Formik
        initialValues={initialValues}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Dialog
            open={partnerId !== undefined && !loading}
            onClose={() => onClose(undefined)}
            maxWidth="lg"
            fullWidth
          >
            <Form>
              <DialogTitle sx={styles.dialogTitle}>
                {partnerId ? 'Editar' : 'Adicionar'} cliente
                <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                  <i className="ri-close-line" />
                </IconButton>
              </DialogTitle>

              <DialogContent sx={{ px: 3, pb: 2, maxHeight: '80vh', overflowY: 'auto' }}>
                
                 <fieldset className="dark-fieldset">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 1.5 }}>
                      <Field component={SelectField} label="Tipo" name="typeId">
                        <MenuItem value="">[Selecione]</MenuItem>
                        <MenuItem value="1">1 - Física</MenuItem>
                        <MenuItem value="2">2 - Jurídica</MenuItem>
                      </Field>
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 2.5 }}>
                      <Field component={TextField} label="CNPJ" name="cpfCnpj" />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <Field component={TextField} label="Razão social" name="name" />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <Field component={TextField} label="Fantasia" name="surname" />
                    </Grid>
                  </Grid>
                </fieldset>

                <br></br>

                {/* ------------------ TABS ------------------ */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
                    <Tab label="Principal" />
                    <Tab label="Endereços" />
                    <Tab label="Contatos" />
                    <Tab label="Arquivos" />
                  </Tabs>
                </Box>

                {/* ------------------ ABA 0: DADOS PRINCIPAIS ------------------ */}
                {tab === 0 && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <CepField />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 5.2 }}>
                        <Field component={TextField} label="Logradouro" name="address.street" />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 1.8 }}>
                        <Field component={TextField} label="Número" name="address.number" />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Field component={TextField} label="Complemento" name="address.complement" />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4.7 }}>
                        <Field component={TextField} label="Bairro" name="address.district" />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 2.5 }}>
                        <Field
                          component={AutoComplete}
                          name="address.city.state"
                          label="Estado"
                          text={(state) => state?.name}
                          onSearch={(value) => search.state(value)}
                          onChange={(value) => {
                            if (!value) setFieldValue('address.city', null);
                          }}
                          renderSuggestion={(item) => <span>{item.name}</span>}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4.8 }}>
                        <Field
                          component={AutoComplete}
                          name="address.city"
                          label="Cidade"
                          text={(city) => `${city.name} - ${city.state?.acronym}`}
                          onSearch={async (value) => {
                            if (!values.address.state?.codigo_uf) {
                              await Swal.fire({ icon: 'warning', text: 'Primeiro, informe o estado!', confirmButtonText: 'Ok' });
                              return [];
                            }
                            return await search.city(value, values.address.state?.codigo_uf);
                          }}
                          renderSuggestion={(item) => <span>{item.name} - {item.state?.acronym}</span>}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* ------------------ ABA 1: OUTROS ENDEREÇOS ------------------ */}
                {tab === 1 && (
                  <Box>
                    <fieldset>
                      <legend>Outros endereços</legend>
                      <p style={{ color: '#777' }}>Aqui você poderá cadastrar endereços adicionais (ex: cobrança, entrega, etc.)</p>
                      {/* TODO: Adicionar tabela/lista com botão "Novo endereço" */}
                    </fieldset>
                  </Box>
                )}

                {/* ------------------ ABA 2: CONTATOS ------------------ */}
                {tab === 2 && (
                  <Box>
                    <fieldset>
                      <legend>Contatos</legend>
                      <p style={{ color: '#777' }}>Aqui você poderá adicionar contatos de e-mail, telefone, etc.</p>
                      {/* TODO: Adicionar lista de contatos e botão "Adicionar contato" */}
                    </fieldset>
                  </Box>
                )}

                {/* ------------------ ABA 3: ARQUIVOS ------------------ */}
                {tab === 3 && (
                  <Box>
                    <fieldset>
                      <legend>Arquivos</legend>
                      <p style={{ color: '#777' }}>Envie ou visualize documentos anexados a este parceiro.</p>
                      {/* TODO: Upload de arquivos e listagem */}
                    </fieldset>
                  </Box>
                )}
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
    </>
  );
};
