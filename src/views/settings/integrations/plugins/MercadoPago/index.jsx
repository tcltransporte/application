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

export const ID = 'A4B0DD1D-74E7-4B22-BFAA-0A911A419B88'

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