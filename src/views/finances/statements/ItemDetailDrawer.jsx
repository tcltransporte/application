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
} from '@mui/material'
import { useState, useMemo } from 'react'
import { parseISO, isAfter, isBefore, isEqual } from 'date-fns'

export function ItemDetailDrawer({ open, onClose, itemId }) {
  const [historico, setHistorico] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  const [filtrosAtivos, setFiltrosAtivos] = useState({
    historico: '',
    dataInicial: null,
    dataFinal: null,
  })

  const contas = [
    { id: 1, descricao: 'Aluguel', valor: 2500.0, vencimento: '2025-06-10', status: 'Pendente' },
    { id: 2, descricao: 'Energia', valor: 750.55, vencimento: '2025-06-15', status: 'Pago' },
    { id: 3, descricao: 'Internet', valor: 199.9, vencimento: '2025-06-20', status: 'Pendente' },
  ]

  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      const matchHistorico = conta.descricao.toLowerCase().includes(filtrosAtivos.historico.toLowerCase())
      const dataVencimento = parseISO(conta.vencimento)

      const { dataInicial, dataFinal } = filtrosAtivos

      const matchDataInicial = dataInicial
        ? isAfter(dataVencimento, dataInicial) || isEqual(dataVencimento, dataInicial)
        : true

      const matchDataFinal = dataFinal
        ? isBefore(dataVencimento, dataFinal) || isEqual(dataVencimento, dataFinal)
        : true

      return matchHistorico && matchDataInicial && matchDataFinal
    })
  }, [contas, filtrosAtivos])

  const aplicarFiltro = () => {
    setFiltrosAtivos({
      historico,
      dataInicial: dataInicial ? parseISO(dataInicial) : null,
      dataFinal: dataFinal ? parseISO(dataFinal) : null,
    })
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} style={{ zIndex: 1300 }}>
      <Box sx={{ width: 900, p: 3 }} role="presentation">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Contas a pagar</Typography>
          <IconButton onClick={onClose}>
            <i className="ri-close-line" />
          </IconButton>
        </Box>

        {itemId ? (
          <>
            <Typography sx={{ mb: 2 }}>
              <strong>ID do Item:</strong> {itemId}
            </Typography>

            {/* Filtros */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                label="Histórico"
                variant='filled'
                value={historico}
                onChange={(e) => setHistorico(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ fontSize: '1.1rem' }}
              />
              <TextField
                label="Início"
                variant='filled'
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  minWidth: 180,
                  '& .MuiInputBase-root': { fontSize: '1.1rem', height: 50 },
                  '& .MuiInputLabel-root': { fontSize: '1.1rem' },
                }}
              />
              <TextField
                label="Fim"
                variant='filled'
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  minWidth: 180,
                  '& .MuiInputBase-root': { fontSize: '1.1rem', height: 50 },
                  '& .MuiInputLabel-root': { fontSize: '1.1rem' },
                }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={aplicarFiltro}
                sx={{ whiteSpace: 'nowrap', minWidth: 120, height: 50, fontSize: '1.1rem' }}
              >
                Buscar
              </Button>
            </Stack>

            {/* Tabela */}
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="right">Vencimento</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contasFiltradas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell>{conta.descricao}</TableCell>
                      <TableCell align="right">
                        {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">{conta.vencimento}</TableCell>
                      <TableCell align="right">{conta.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography>Nenhum item selecionado.</Typography>
        )}
      </Box>
    </Drawer>
  )
}
