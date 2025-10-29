import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { parseISO, format } from 'date-fns'
import * as payment2 from '@/app/server/finances/payments'
import _ from 'lodash'
import { useSession } from 'next-auth/react'
import { Formik, Form, Field } from 'formik'
import { AutoComplete, TextField } from '@/components/field'

import * as search from '@/utils/search'

// Helper function for currency formatting
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// --- CARD COMPONENT ---
function ReceivementCard({ item, onConfirm, isConfirming }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        position: 'relative',
        transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s',
        borderColor: 'divider',
        flexShrink: 0,
        '&:hover': {
          boxShadow: 3,
          borderColor: 'primary.main',
        },
        '&:hover .confirm-button': {
          opacity: 1,
          visibility: 'visible',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">Fornecedor</Typography>
          <Typography variant="subtitle1" fontWeight="bold">
            {item.financialMovement?.partner?.surname || 'N/A'}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h6" color="primary.main" fontWeight="bold">
            {formatCurrency(item.amount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {format(parseISO(item.dueDate), 'dd/MM/yyyy')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">Observação</Typography>
        <Button
          className="confirm-button"
          variant="contained"
          color="success"
          size="small"
          disabled={isConfirming}
          onClick={() => onConfirm(item)}
          startIcon={
            isConfirming ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <i className="ri-check-line text-lg" />
            )
          }
          sx={{
            opacity: 0,
            visibility: 'hidden',
            transition: 'opacity 0.3s ease-in-out, visibility 0.3s',
            ml: 2,
          }}
        >
          {isConfirming ? 'Confirmando' : 'Confirmar'}
        </Button>
      </Box>
    </Paper>
  )
}

// --- MAIN COMPONENT ---
export function ViewVinculePayment({ open, onClose, itemId, onSelected }) {

  const session = useSession()
  const [payments, setPayments] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmingId, setConfirmingId] = useState(null)

  const getToday = () => format(new Date(), 'yyyy-MM-dd')

  const fetchData = async (values) => {
    setLoading(true)
    try {
      
      const { partner, historico, dataInicial, dataFinal } = values

      const items = await payment2.findAll({
        company: session.data.company,
        receiver: partner,
        limit: 50,
        offset: 0,
        dueDate: {
          start: `${dataInicial} 00:00:00`,
          end: `${dataFinal} 23:59:59`,
        },
        observation: historico || undefined,
      })

      setPayments(items)

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async (item) => {
    setConfirmingId(item.codigo_movimento_detalhe)
    try {
      if (item && onSelected) {
        await onSelected(itemId, item.codigo_movimento_detalhe)
      }
    } catch (error) {
      console.error('Confirmation failed:', error)
    } finally {
      setConfirmingId(null)
    }
  }

  useEffect(() => {
    if (!open) {
      setPayments(null)
    }
  }, [open])

  return (
    <Drawer anchor="right" open={open} onClose={onClose} style={{ zIndex: 1300 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="h5">Contas a pagar</Typography>
            <IconButton size="small" onClick={onClose}>
              <i className="ri-close-line text-2xl" />
            </IconButton>
          </Box>
          <Divider />
        </Box>

        {/* Filters com Formik */}
        {itemId && (
          <Formik
            initialValues={{
              historico: '',
              partner: null,
              dataInicial: getToday(),
              dataFinal: getToday(),
            }}
            onSubmit={fetchData}
          >
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <Form onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
                <Box sx={{ p: 3, pb: 2 }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item size={{ xs: 12 }}>
                      <Field
                        component={AutoComplete}
                        name="partner"
                        label="Fornecedor"
                        text={(partner) => `${partner.surname}`}
                        onSearch={search.partner}
                        renderSuggestion={(item) => (
                          <span>{item?.surname}</span>
                        )}
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 4 }}>
                      <Field
                        component={TextField}
                        type="text"
                        name="historico"
                        label="Observação"
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 3 }}>
                      <Field
                        component={TextField}
                        type="date"
                        name="dataInicial"
                        label="Início"
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 3 }}>
                      <Field
                        component={TextField}
                        type="date"
                        name="dataFinal"
                        label="Fim"
                      />
                    </Grid>

                    <Grid item size={{ xs: 12, sm: 2 }} display="flex" alignItems="center">
                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        type="submit"
                        startIcon={<i className="ri-search-line" />}
                        sx={{ height: 38 }}
                        disabled={loading || isSubmitting}
                      >
                        {loading ? 'Buscando' : 'Buscar'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Form>
            )}
          </Formik>
        )}

        {/* Cards scrolláveis */}
        {itemId ? (
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 3,
              pt: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : payments == null ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                <Typography color="text.secondary">Informe o filtro e aplique a busca</Typography>
              </Paper>
            ) : _.size(payments?.response?.rows) > 0 ? (
              _.map(payments?.response?.rows, (item) => (
                <ReceivementCard
                  key={item.codigo_movimento_detalhe}
                  item={item}
                  onConfirm={handleConfirmar}
                  isConfirming={confirmingId === item.codigo_movimento_detalhe}
                />
              ))
            ) : (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
                <Typography color="text.secondary">Nenhum resultado encontrado para os filtros aplicados.</Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography>Nenhum item selecionado para vincular.</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}
