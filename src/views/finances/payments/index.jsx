'use client'

import { useState } from 'react'
import {
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
} from '@mui/material'
import { Grid } from '@mui/material'
import { format } from 'date-fns'
import { getPayments } from './index.controller'
import { ViewPaymentInstallment } from './view.payment-installment'
//import { ViewAddStatement } from './view.add-statement'
//import { getStatements } from './index.controller'
//import { ViewStatementDetail } from './view.statement-detail'

const exampleTransactions = [
  {
    id: '1',
    date: new Date('2025-06-01'),
    order: 'Pedido #12345',
    amount: 500.0,
    fee: 5.0,
    type: 'credit',
    balance: 1495.0,
    concileds: [],
  },
  {
    id: '2',
    date: new Date('2025-06-02'),
    order: 'Pedido #12346',
    amount: 300.0,
    fee: 3.0,
    type: 'debit',
    balance: 1195.0,
    concileds: [],
  },
]

function Payments({ initialPayments }) {

  const [open, setOpen] = useState(false)
  const [payments, setPayments] = useState([...initialPayments])
  const [selectedStatement, setSelectedStatement] = useState(null)

  const [installmentId, setInstallmentId] = useState(undefined)

  const fetch = async () => {
    const payments = await getPayments()
    setPayments(payments)
  }

  const handleEdit = ({installmentId}) => {
    //statement.transactions = exampleTransactions
    //setSelectedStatement({statementId})
    setInstallmentId(installmentId)
  }

  const handleDelete = (id) => {
    const updated = payments.filter((s) => s.sourceId !== id)
    setPayments(updated)
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Contas a pagar
      </Typography>

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        startIcon={<i className="ri-add-circle-line" />}
        onClick={() => setInstallmentId(null)}
      >
        Adicionar
      </Button>

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
                <TableCell align='right'>{new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.amount)}</TableCell>
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
                      <IconButton onClick={() => handleEdit({installmentId: payment.codigo_movimento_detalhe})}>
                        <i className="ri-edit-2-line text-lg" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(payment.sourceId)} color="error">
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
      
      <ViewPaymentInstallment installmentId={installmentId} onClose={(installment) => {
        console.log("@".repeat(10))
        console.log(installment)
        console.log("@".repeat(10))
        setInstallmentId(undefined)
      }} />
{/*
      <ViewAddStatement open={open} setOpen={setOpen} onSubmit={fetch} />

      <ViewStatementDetail
        statementId={statementId}
        onClose={() => setStatementId(undefined)}
        onError={() => setStatementId(undefined)}
        statement={selectedStatement}
      />
*/}
    </>
  )
}

export const ViewFinancesPayments = ({ initialPayments }) => {
  return (
    <Grid container spacing={6}>
      <Grid size='grow'>
        <Payments initialPayments={initialPayments} />
      </Grid>
    </Grid>
  )
}