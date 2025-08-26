'use client'

import React, { useEffect, useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material'
//import { getStatement, getStatements } from './index.controller'
import { format, fromZonedTime } from 'date-fns-tz'
import { getStatement, getStatements } from '@/app/server/settings/integrations/plugins/index.controller'
import { IntegrationSuccess } from '../..'
import { Field, Form, Formik } from 'formik'
import { TextField } from '@/components/field'

export const ID = 'E6F39F15-5446-42A7-9AC4-A9A99E604F07'

export const Statement = ({ data, onChange }) => {
  const [statements, setStatements] = useState([])
  const [selectedStatement, setSelectedStatement] = useState(null)
  const [loading, setLoading] = useState(false)
  const [rowLoading, setRowLoading] = useState(null) // <- novo estado

  useEffect(() => {
    fetch({ companyIntegrationId: data.companyIntegrationId })
  }, [])

  const fetch = async ({ companyIntegrationId }) => {
    setLoading(true)
    try {
      const statements = await getStatements({ companyIntegrationId })
      setStatements(statements)
    } catch (err) {
      console.error('Erro ao carregar extratos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = async (item) => {
    setRowLoading(item.sourceId)
    try {
      const statementData = await getStatement({
        companyIntegrationId: data.companyIntegrationId,
        fileName: item.fileName
      })
      item.statementData = statementData
      setSelectedStatement(item)
      await onChange(item) // <- suporta async
    } catch (err) {
      console.error('Erro ao selecionar extrato:', err)
    } finally {
      setRowLoading(null)
    }
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography fontWeight="bold">Selecione um extrato</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => fetch({ companyIntegrationId: data.companyIntegrationId })}
          disabled={loading}
          startIcon={
            <i
              className="ri-refresh-line"
              style={{
                fontSize: '18px',
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}
            />
          }
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </Box>

      {loading ? (
        <Box mt={2} display="flex" justifyContent="center">
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Paper variant="outlined" sx={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Início</TableCell>
                  <TableCell>Final</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statements.map((item) => {
                  const isSelected = selectedStatement?.sourceId === item.sourceId
                  const isLoadingRow = rowLoading === item.sourceId

                  return (
                    <TableRow
                      key={item.sourceId}
                      hover
                      onClick={() => handleRowClick(item)}
                      sx={{
                        cursor: isLoadingRow ? 'wait' : 'pointer',
                        backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : undefined
                      }}
                    >
                      <TableCell width={30}>
                        {isLoadingRow ? (
                          <CircularProgress size={16} />
                        ) : (
                          isSelected && <i className="ri-check-line" style={{ fontSize: '16px' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {format(
                          fromZonedTime(item.begin, Intl.DateTimeFormat().resolvedOptions().timeZone),
                          'dd/MM/yyyy HH:mm'
                        )}
                      </TableCell>
                      <TableCell>
                        {format(
                          fromZonedTime(item.end, Intl.DateTimeFormat().resolvedOptions().timeZone),
                          'dd/MM/yyyy HH:mm'
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </div>
  )
}

export const Connect = () => {
  
  const handleConnect = (values) => {
    console.log('Form values:', values)

    // aqui você decide o que fazer com os dados
    // ex: salvar no backend, autenticar, etc.
    //window.location.href = `https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth?client_id=${process.env.NEXT_PUBLIC_TINY_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_TINY_REDIRECT_URL}&scope=openid&response_type=code`
  }

  return (
    <Formik
      initialValues={{ token: '', session: '', csrf: '' }}
      onSubmit={handleConnect}
    >
      {({ isSubmitting }) => (
        <Form style={{ width: '100%' }}>
          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Field
              as={TextField}
              name="token"
              label="Token"
            />
            <Field
              as={TextField}
              name="session"
              label="Session"
            />
            <Field
              as={TextField}
              name="csrf"
              label="CSRF"
            />
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" type="reset" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Conectando...' : 'Conectar'}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  )
}