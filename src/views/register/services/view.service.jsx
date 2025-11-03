'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { CircularProgress } from "@mui/material";
import { styles } from "@/components/styles";
import * as services from "@/app/server/register/services";

import { TextField } from "@/components/field";
import { BackdropLoading } from "@/components/BackdropLoading";
import _ from "lodash";

export const ViewService = ({ serviceId, onClose }) => {

  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);

  useEffect(() => {

    const fetchService = async () => {
      setLoading(true);
      try {

        const service = await services.findOne({ id: serviceId })
        setService(service)

      } catch (error) {
        setErrorState(error);
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }

  }, [serviceId]);

  const initialValues = {
    id: service?.id,
    name: service?.name || '',
  };

  const handleSubmit = async (values) => {
    try {

      const service = await services.upsert(values)

      onClose(service)

    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <>
      <BackdropLoading loading={serviceId !== undefined && loading} message={`Carregando...`} />

        <Formik
          initialValues={initialValues}
          enableReinitialize
          //validationSchema={Yup.object({})}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => {

            return (
              <Dialog open={serviceId !== undefined && !loading} onClose={() => onClose(undefined)} maxWidth={'sm'}>

                <Form>
  
                  <DialogTitle sx={styles.dialogTitle}>
                    {serviceId ? 'Editar' : 'Adicionar'} serviço
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

                        <Grid item size={{xs: 12, sm: 12}}>
                          <Field
                            component={TextField}
                            label="Descrição"
                            type="text"
                            name="name"
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
