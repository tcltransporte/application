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
} from '@mui/material'
import { useState, useEffect } from 'react'
import { parseISO, format } from 'date-fns'
//import * as payments from '@/app/server/finances/payments'
import _ from 'lodash'

export function ViewVinculeReceivement({ open, onClose, itemId, onSelected }) {

  const [historico, setHistorico] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [receivements, setPayments] = useState([])
  const [selectedCodigo, setSelectedCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setSelectedCodigo('')
    if (itemId) {
      fetchData()
    }
  }, [itemId])

  const fetchData = async () => {
    setLoading(true)
    try {
      /*
      const items = await payments.findAll({
        limit: 50,
        offset: 0,
        dueDate: {
          start: '2025-06-23 00:00:00',
          end: '2025-06-23 23:59:59',
        },
      })
      setPayments(items)
      */
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltro = () => {
    // lógica de filtro a ser aplicada
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
        <Typography variant='h5'>Contas a receber</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>

      <Divider />

      <Box sx={{ width: 1000, p: 3 }} role="presentation">
        {itemId ? (
          <>
            {/* Filtros */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                label="Histórico"
                variant="filled"
                value={historico}
                onChange={(e) => setHistorico(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Início"
                variant="filled"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Fim"
                variant="filled"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ minWidth: 180 }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={aplicarFiltro}
                sx={{ whiteSpace: 'nowrap', minWidth: 120, height: 50 }}
              >
                Buscar
              </Button>
            </Stack>

            {/* Tabela */}
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Histórico</TableCell>
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
                    _.map(receivements.response?.rows, (item, index) => (
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
                        <TableCell>{item.description}</TableCell>
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
