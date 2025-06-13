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
import Grid from '@mui/material/Grid'
import { format } from 'date-fns'
import { ViewAddStatement } from './view.add-statement'
import { getStatements } from './index.controller'
import { ViewStatementDetail } from './view.statement-detail'

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

function ExtratoScreen({ initialStatements }) {

  const [open, setOpen] = useState(false)
  const [statements, setStatements] = useState([...initialStatements])
  const [selectedStatement, setSelectedStatement] = useState(null)

  const [statementId, setStatementId] = useState(undefined)

  const fetch = async () => {
    const statements = await getStatements()
    setStatements(statements)
  }

  const handleEdit = ({statementId}) => {
    //statement.transactions = exampleTransactions
    //setSelectedStatement({statementId})
    setStatementId(statementId)
  }

  const handleDelete = (id) => {
    const updated = statements.filter((s) => s.sourceId !== id)
    setStatements(updated)
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Extratos
      </Typography>

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        startIcon={<i className="ri-add-circle-line" />}
        onClick={() => setOpen(true)}
      >
        Adicionar
      </Button>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Banco</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fim</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statements.map((statement, index) => (
              <TableRow
                key={index}
                sx={{
                  '&:hover .action-buttons': { opacity: 1 },
                }}
              >
                <TableCell>{statement.sourceId}</TableCell>
                <TableCell>
                  <div className="flex items-start space-x-2">
                    {statement.bankAccount.bank?.icon && (
                      <img
                        src={statement.bankAccount.bank.icon}
                        alt={statement.bankAccount.bank.name}
                        className="mt-1 w-[1.725rem] h-[1.725rem]"
                      />
                    )}
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{statement.bankAccount.bank.name}</span>
                      <span>
                        Agência: {statement.bankAccount.agency} / Conta:{' '}
                        {statement.bankAccount.number}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{format(statement.begin, 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{format(statement.end, 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{statement.isActive ? 'Pendente' : 'Excluído'}</TableCell>
                <TableCell align="center">
                  <div className="action-buttons">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEdit({statementId: statement.id})}>
                        <i className="ri-edit-2-line text-lg" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDelete(statement.sourceId)} color="error">
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

      <ViewAddStatement open={open} setOpen={setOpen} onSubmit={fetch} />

      <ViewStatementDetail
        statementId={statementId}
        onClose={() => setStatementId(undefined)}
        onError={() => setStatementId(undefined)}
        statement={selectedStatement}
      />

    </>
  )
}

export const ViewFinancesStatements = ({ initialStatements }) => {
  return (
    <Grid container spacing={6}>
      <Grid size='grow'>
        <ExtratoScreen initialStatements={initialStatements} />
      </Grid>
    </Grid>
  )
}