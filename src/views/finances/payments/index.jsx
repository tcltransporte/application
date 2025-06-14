'use client'

import { useEffect, useState } from 'react'
import { Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip, Drawer, Box, TextField, Divider, Grid } from '@mui/material'
import { format } from 'date-fns'
import { ViewPaymentInstallment } from './view.payment-installment'

import { getPayments } from '@/app/server/finances/payments/index.controller'

import { useTitle } from '@/contexts/TitleProvider'

export const ViewFinancesPayments = ({ initialPayments }) => {

  const { setTitle } = useTitle()

  const [openDrawer, setOpenDrawer] = useState(false)
  const [payments, setPayments] = useState([...initialPayments])
  const [installmentId, setInstallmentId] = useState(undefined)

  useEffect(() => {
    setTitle(['Finanças', 'Contas a pagar'])
  }, [])

  const fetch = async () => {
    const payments = await getPayments()
    setPayments(payments)
  }

  const handleEdit = ({ installmentId }) => {
    setInstallmentId(installmentId)
  }

  const handleDelete = (id) => {
    const updated = payments.filter((s) => s.sourceId !== id)
    setPayments(updated)
  }

  return (
    <>

      {/* Header com Botões */}
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        {/* Botão Adicionar à esquerda */}
        <Grid item>
          <Button
            variant="contained"
            startIcon={<i className="ri-add-circle-line" />}
            onClick={() => setInstallmentId(null)}
          >
            Adicionar
          </Button>
        </Grid>

        {/* Botões Período, Filtros e Pesquisar à direita */}
        <Grid item>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<i className="ri-calendar-line" />}
              onClick={() => console.log('Abrir seleção de período')}
            >
              Período
            </Button>

            <Button
              variant="outlined"
              startIcon={<i className="ri-equalizer-line" />}
              onClick={() => setOpenDrawer(true)}
            >
              Filtros
            </Button>

            <Button
              variant="contained"
              startIcon={<i className="ri-search-line" />}
              onClick={() => console.log('Executar pesquisa')}
            >
              Pesquisar
            </Button>
          </Box>
        </Grid>
      </Grid>



      {/* Tabela de pagamentos */}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Número documento</TableCell>
              <TableCell>Beneficiário</TableCell>
              <TableCell>Forma de pagamento</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Agendamento</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Agência/Conta</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:hover .action-buttons': { opacity: 1 },
                }}
              >
                <TableCell>{payment.financialMovement?.documentNumber}</TableCell>
                <TableCell>{payment.financialMovement?.partner?.surname}</TableCell>
                <TableCell>{payment.paymentMethod?.name}</TableCell>
                <TableCell>{format(payment.dueDate, 'dd/MM/yyyy')}</TableCell>
                <TableCell>{format(payment.dueDate, 'dd/MM/yyyy')}</TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(payment.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-start space-x-2">
                    {payment.bankAccount?.bank?.icon && (
                      <img
                        src={payment.bankAccount?.bank?.icon}
                        alt={payment.bankAccount?.bank?.name}
                        className="mt-1 w-[1.725rem] h-[1.725rem]"
                      />
                    )}
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{payment.bankAccount?.bank?.name}</span>
                      <span>
                        Agência: {payment.bankAccount?.agency} / Conta:{' '}
                        {payment.bankAccount?.number}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell align="center">
                  <div className="action-buttons">
                    <Tooltip title="Editar">
                      <IconButton
                        onClick={() =>
                          handleEdit({
                            installmentId: payment.codigo_movimento_detalhe,
                          })
                        }
                      >
                        <i className="ri-edit-2-line text-lg" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        onClick={() => handleDelete(payment.sourceId)}
                        color="error"
                      >
                        <i className="ri-delete-bin-line text-lg" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal de edição ou criação */}
      <ViewPaymentInstallment
        installmentId={installmentId}
        onClose={() => setInstallmentId(undefined)}
      />

      {/* Drawer de filtros */}
      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>

        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Filtros</Typography>
          <IconButton size='small' onClick={() => setOpenDrawer(false)}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>

        <Divider />
        
        <Box sx={{ width: 300, p: 3 }}>

          <TextField
            fullWidth
            label="Beneficiário"
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Número documento"
            variant="outlined"
            margin="normal"
          />
          {/* Adicione mais filtros aqui */}

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button onClick={() => setOpenDrawer(false)} variant="contained">
              Aplicar
            </Button>
          </Box>
        </Box>

      </Drawer>
    </>
  )

}