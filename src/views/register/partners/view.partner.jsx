'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Grid, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { CircularProgress } from "@mui/material";
import { styles } from "@/components/styles";
import * as partners from "@/app/server/register/partner";

import { SelectField, TextField } from "@/components/field";
import { BackdropLoading } from "@/components/BackdropLoading";
import _ from "lodash";

export const ViewService = ({ partnerId, onClose }) => {

  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);

  useEffect(() => {

    const fetchService = async () => {
      setLoading(true);
      try {

        const partner = await partners.findOne({ id: partnerId })
        setPartner(partner)

      } catch (error) {
        setErrorState(error);
      } finally {
        setLoading(false);
      }
    };

    if (partnerId) {
      fetchService()
    } else {
      setPartner(null)
    }

  }, [partnerId]);

  const initialValues = {
    codigo_pessoa: partner?.codigo_pessoa,
    partnerType: partner?.partnerType ?? 2,
    cpfCnpj: partner?.cpfCnpj ?? '',
    surname: partner?.surname ?? '',
    name: partner?.name ?? '',
  };

  const handleSubmit = async (values) => {
    try {

      const partner = await partners.upsert(values)

      onClose(partner)

    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <>
      <BackdropLoading loading={partnerId !== undefined && loading} message={`Carregando...`} />

        <Formik
          initialValues={initialValues}
          enableReinitialize
          //validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => {

            return (
              <Dialog open={partnerId !== undefined && !loading} onClose={() => onClose(undefined)} maxWidth={'lg'}>

                <Form>
  
                  <DialogTitle sx={styles.dialogTitle}>
                    {partnerId ? 'Editar' : 'Adicionar'} cliente
                    <IconButton aria-label="close" onClick={() => onClose(false)} sx={styles.dialogClose}>
                      <i className="ri-close-line" />
                    </IconButton>
                  </DialogTitle>

                  <DialogContent
                    sx={{
                      maxHeight: '80vh',
                      overflowY: 'auto',
                      px: 3,
                    }}>

                    <fieldset className="dark-fieldset">

                      <Grid container direction="row" spacing={2}>

                        <Grid size={{ xs: 12, sm: 1.5 }}>
                          <Field
                            component={SelectField}
                            label="Tipo"
                            name="partnerType"
                          >
                            <MenuItem value="">[Selecione]</MenuItem>
                            <MenuItem value="1">1 - Fisica</MenuItem>
                            <MenuItem value="2">2 - Juridica</MenuItem>
                          </Field>
                        </Grid>

                        <Grid item size={{xs: 12, sm: 2.5}}>
                          <Field
                            component={TextField}
                            label="CNPJ"
                            type="text"
                            name="cpfCnpj"
                          />
                        </Grid>

                        <Grid item size={{xs: 12, sm: 4}}>
                          <Field
                            component={TextField}
                            label="Razão social"
                            type="text"
                            name="name"
                          />
                        </Grid>

                        <Grid item size={{xs: 12, sm: 4}}>
                          <Field
                            component={TextField}
                            label="Fantasia"
                            type="text"
                            name="surname"
                          />
                        </Grid>
                          
                      </Grid>

                    </fieldset>
                 
                  </DialogContent>

                  <DialogActions sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                   
                    <div></div>
                   
                    {/* Botão à direita */}
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
            )
          }}
        </Formik>
    </>
  );
}
