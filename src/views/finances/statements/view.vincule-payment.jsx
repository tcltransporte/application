import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Stack,
  Button,
  Radio,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { parseISO, format } from 'date-fns'
import { getPayments } from '@/app/server/finances/payments/index.controller'
import _ from 'lodash'

export function ViewVinculePayment({ open, onClose, itemId, onSelected }) {
  const [historico, setHistorico] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [payments, setPayments] = useState([])
  const [selectedCodigo, setSelectedCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Função util para pegar data de hoje em yyyy-MM-dd (para input[type=date])
  const getToday = () => format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    // Sempre que abrir o drawer com itemId, setar a data de hoje
    if (itemId) {
      const today = getToday()
      setDataInicial(today)
      setDataFinal(today)
      setSelectedCodigo('')
      fetchData(today, today)
    }
  }, [itemId])

  const fetchData = async (start, end) => {
    setLoading(true)
    try {
      const payments = await getPayments({
        limit: 50,
        offset: 0,
        dueDate: {
          start: `${start} 00:00:00`,
          end: `${end} 23:59:59`,
        },
        observation: historico || undefined,
      })
      setPayments(payments)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltro = () => {
    if (dataInicial && dataFinal) {
      fetchData(dataInicial, dataFinal)
    }
  }

  const handleConfirmar = async () => {
    setConfirming(true)
    try {
      const item = _.find(payments.response?.rows, {
        codigo_movimento_detalhe: selectedCodigo,
      })
      if (item && onSelected) {
        await onSelected(itemId, item.codigo_movimento_detalhe)
      }
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} style={{ zIndex: 1300 }}>
      <div className='flex items-center justify-between pli-5 plb-4' style={{ padding: '16px' }}>
        <Typography variant='h5'>Contas a pagar</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>

      <Divider />

      <Box sx={{ width: 1000, p: 3 }} role="presentation">
        {itemId ? (
          <>
            {/* Filtros */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item size={{xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Observação"
                  value={historico}
                  onChange={(e) => setHistorico(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item size={{xs: 12, sm: 2}}>
                <TextField
                  fullWidth
                  label="Início"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                />
              </Grid>

              <Grid item size={{xs: 12, sm: 2}}>
                <TextField
                  fullWidth
                  label="Fim"
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                />
              </Grid>

              <Grid item size={{xs: 12, sm: 2}} display="flex" alignItems="center">
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  onClick={aplicarFiltro}
                  startIcon={<i className="ri-search-line" />} // Remix Icon
                  sx={{ height: 38 }}
                  disabled={loading}
                >
                  {loading ? 'Buscando' : 'Buscar'}
                </Button>
              </Grid>
            </Grid>
            

            {/* Tabela */}
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Observação</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell>Vencimento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    _.map(payments.response?.rows, (item, index) => (
                      <TableRow
                        key={item.codigo_movimento_detalhe ?? index}
                        hover
                        onClick={() => setSelectedCodigo(String(item.codigo_movimento_detalhe))}
                        selected={selectedCodigo === String(item.codigo_movimento_detalhe)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Radio
                            value={item.codigo_movimento_detalhe}
                            color="primary"
                            checked={selectedCodigo === String(item.codigo_movimento_detalhe)}
                            onChange={() => setSelectedCodigo(String(item.codigo_movimento_detalhe))}
                          />
                        </TableCell>
                        <TableCell>{item.financialMovement?.partner?.surname}</TableCell>
                        <TableCell>{item.observation}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(item.amount)}
                        </TableCell>
                        <TableCell>{format(parseISO(item.dueDate), 'dd/MM/yyyy')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Botão Confirmar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="success"
                disabled={!selectedCodigo || confirming}
                onClick={handleConfirmar}
                startIcon={confirming ? <CircularProgress size={16} color="inherit" /> : <i className='ri-check-line text-lg' />}
              >
                {confirming ? 'Confirmando...' : 'Confirmar'}
              </Button>
            </Box>
          </>
        ) : (
          <Typography>Nenhum item selecionado.</Typography>
        )}
      </Box>
    </Drawer>
  )
}
