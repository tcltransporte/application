'use client'

import React, { useEffect, useState } from 'react'
import { Grid, Card, CardContent, CardHeader, TextField, Typography } from '@mui/material'
import Swal from 'sweetalert2'
import { DragAndDrop } from '@/components/DragAndDrop'
import * as certificateService from '@/app/server/settings/certificate'
import _ from 'lodash'
import { Box, CircularProgress } from '@mui/material'
import { BackdropLoading } from '@/components/BackdropLoading'
import { format } from 'date-fns'

export const Certificate = () => {

  const [loading, setLoading] = useState(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const [certificate, setCertificate] = useState()

  const fetchCertificate = async () => {
    try {

      setIsLoading(true)

      const certificate = await certificateService.findOne()

      setCertificate(certificate)

    } catch (error) {
      console.log(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificate()
  }, [])

  const handleUpload = async (files) => {
    try {

      if (_.size(files) > 0) {

        const password = prompt('Informe a senha do certificado')

        if (_.isEmpty(password)) {
          Swal.fire({ icon: 'warning', title: 'Ops!', text: 'E necessário informar a senha do certificado!', confirmButtonText: 'Ok' })
          return
        }

        setLoading('Carregando arquivo PFX...')
        
        await certificateService.submit({ file: files[0], password })

        Swal.fire({ icon: 'success', text: 'Certificado atualizado com sucesso!' })

      } else {
          
        const result = await Swal.fire({ text: 'Tem certeza que deseja excluir ?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim', cancelButtonText: 'Não' })

        if (!result.isConfirmed) {
          return
        }
        
        if (result.isConfirmed) {

          setLoading('Excluindo certificado...')

          await certificateService.destroy()
          
          Swal.fire({ icon: 'success', text: 'Certificado excluido com sucesso!' })

        }
        
      }
      
      fetchCertificate()

    } catch (error) {
      Swal.fire({ icon: 'error', text: error.message })
    } finally {
      setLoading(undefined)
    }
  }

  return (
    <>

      <BackdropLoading loading={loading} message={loading} />

      <Card>
        <CardHeader
          sx={{display: isLoading ? 'none' : 'block'}}
          avatar={<div className="ri-file-certificate-line" style={{ fontSize: 32, color: '#3f51b5' }} />}
          title={<Typography variant="h6" fontWeight={600}>Certificado Digital</Typography>}
          subheader={certificate ? "Visualize os dados e faça upload de um novo certificado" : "Nenhum certificado digital foi configurado"}
        />
        <CardContent>

          {isLoading ? (<Box display="flex" justifyContent="center" my={4}><CircularProgress size={30} /></Box>) :
            (
              <>
                
                <DragAndDrop files={certificate ? [certificate] : []} title={'Arquivo PFX'} accept={'.pfx'} onChange={(files) => handleUpload(files)}></DragAndDrop>

                <Grid container spacing={3}>

                  {certificate && (
                    <>
                      <Grid item size={{xs: 12, sm: 5.4}}>
                        <TextField
                          fullWidth
                          variant="filled"
                          label='Referência'
                          value={certificate.subject?.CN || ''}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item size={{xs: 12, sm: 3}}>
                        <TextField
                          fullWidth
                          variant="filled"
                          label='Serial'
                          value={certificate.serialNumber || ''}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item size={{xs: 12, sm: 1.8}}>
                        <TextField
                          fullWidth
                          variant="filled"
                          label='Emitido em'
                          value={certificate.validFrom ? format(new Date(certificate.validFrom), 'dd/MM/yyyy HH:mm:ss') : ''}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item size={{xs: 12, sm: 1.8}}>
                        <TextField
                          fullWidth
                          variant="filled"
                          label='Expira em'
                          value={certificate.validUntil ? format(new Date(certificate.validUntil), 'dd/MM/yyyy HH:mm:ss') : ''}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                    </>
                  )}
                  
                </Grid>
              </>
            )
          }

        </CardContent>
      </Card>
    </>
  )
}
