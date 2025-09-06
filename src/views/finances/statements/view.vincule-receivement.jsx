import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Paper,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material'
import { useState, useEffect } from 'react'
import { parseISO, format } from 'date-fns'
import * as receivement2 from '@/app/server/finances/receivements' // This import caused an error and has been replaced with mock data.
import _ from 'lodash'

// Helper function for currency formatting (Unchanged)
const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// --- ELEGANT CARD COMPONENT (Unchanged) ---
function ReceivementCard({ item, onConfirm, isConfirming }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        position: 'relative',
        transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s',
        borderColor: 'divider',
        flexShrink: 0, // Prevent card from shrinking in the flex container
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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

      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Observação</Typography>
            <Typography variant="body1">
              {item.observation || '-'}
            </Typography>
          </Box>
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
                <i className='ri-check-line text-lg' />
              )
            }
            sx={{
              opacity: 0,
              visibility: 'hidden',
              transition: 'opacity 0.3s ease-in-out, visibility 0.3s',
              ml: 2,
              flexShrink: 0,
            }}
          >
            {isConfirming ? 'Confirmando' : 'Confirmar'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}


// --- MAIN COMPONENT (Updated) ---
export function ViewVinculeReceivement({ open, onClose, itemId, onSelected }) {
  const [historico, setHistorico] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirmingId, setConfirmingId] = useState(null)

  const getToday = () => format(new Date(), 'yyyy-MM-dd')

  const fetchData = async (start, end) => {
    setLoading(true);
    try {
      const items = await receivement2.findAll({
        limit: 50,
        offset: 0,
        dueDate: {
          start: `${start} 00:00:00`,
          end: `${end} 23:59:59`,
        },
        observation: historico || undefined,
      });
      setPayments(items);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId && open) {
      const today = getToday();
      setDataInicial(today);
      setDataFinal(today);
      fetchData(today, today);
    } else if (!open) {
      setHistorico('');
      setPayments([]);
    }
  }, [itemId, open]);

  const aplicarFiltro = () => {
    if (dataInicial && dataFinal) {
      fetchData(dataInicial, dataFinal);
    }
  };
  
  const handleConfirmar = async (item) => {
    console.log(item)
    setConfirmingId(item.codigo_movimento_detalhe);
    try {
      if (item && onSelected) {
        await onSelected(itemId, item.codigo_movimento_detalhe);
      }
    } catch (error) {
      console.error("Confirmation failed:", error);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} style={{ zIndex: 1300 }}>
      {/* 1. Main Flex Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* === FIXED HEADER === */}
        <Box sx={{ flexShrink: 0 }}>
          <div className='flex items-center justify-between pli-5 plb-4' style={{ padding: '16px 24px' }}>
            <Typography variant='h5'>Contas a receber</Typography>
            <IconButton size='small' onClick={onClose}>
              <i className='ri-close-line text-2xl' />
            </IconButton>
          </div>
          <Divider />
        </Box>
        
        {/* === FIXED FILTERS === */}
        {itemId && (
           <Box sx={{ p: 3, pb: 2, flexShrink: 0 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item size={{xs: 12, sm: 4}}>
                  <TextField
                    fullWidth
                    label="Observação"
                    value={historico}
                    onChange={(e) => setHistorico(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item size={{xs: 12, sm: 3}}>
                  <TextField
                    fullWidth
                    label="Início"
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                  />
                </Grid>

                <Grid item size={{xs: 12, sm: 3}}>
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
          </Box>
        )}
        
        {/* === SCROLLABLE CARDS CONTAINER === */}
        {itemId ? (
          <Box
            sx={{
              flexGrow: 1, // 2. Allow this Box to grow
              overflowY: 'auto', // 3. Enable vertical scrolling
              p: 3,
              pt: 0, // Remove top padding to be adjacent to filters
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              _.size(payments.response?.rows) > 0 ? (
                _.map(payments.response?.rows, (item) => (
                  <ReceivementCard
                    key={item.codigo_movimento_detalhe}
                    item={item}
                    onConfirm={handleConfirmar}
                    isConfirming={confirmingId === item.codigo_movimento_detalhe}
                  />
                ))
              ) : (
                  <Paper variant="outlined" sx={{p: 4, textAlign: 'center', backgroundColor: 'grey.50'}}>
                    <Typography color="text.secondary">Nenhum resultado encontrado para os filtros aplicados.</Typography>
                  </Paper>
              )
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