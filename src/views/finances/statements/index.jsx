'use client'

import { useEffect, useState } from 'react'
import { Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Tooltip, Box, Checkbox, TablePagination, CircularProgress } from '@mui/material'
import { format } from 'date-fns'
import { ViewAddStatement } from './view.add-statement'
import { ViewStatementDetail } from './view.statement-detail'
import { getStatements } from '@/app/server/finances/statements/index.controller'
import { useTitle } from '@/contexts/TitleProvider'
import { styles } from '@/components/styles'
import { RangeFilter } from '@/components/RangeFilter'
import _ from 'lodash'

export const ViewFinancesStatements = ({ initialStatements }) => {

  const { setTitle } = useTitle()

  const [isFetching, setIsFetching] = useState(false)

  const [open, setOpen] = useState(false)
  const [statements, setStatements] = useState(initialStatements)

  const [statementId, setStatementId] = useState(undefined)

  useEffect(() => {
    setTitle(['Finanças', 'Extratos'])
  }, [])

  const fetchStatements = async (request) => {
    try {
      setIsFetching(true)
      const response = await getStatements(request)
      setStatements(response)
      //setSelectedIds(new Set()) // limpa seleção ao buscar nova página
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleEdit = ({statementId}) => {
    setStatementId(statementId)
  }

  const handleDelete = (id) => {
    const updated = statements.filter((s) => s.sourceId !== id)
    setStatements(updated)
  }

  return (
    <>
    
      <Box sx={styles.container}>

        <Box sx={styles.header}>
          <Button variant="contained" startIcon={<i className="ri-add-circle-line" />} onClick={() => setOpen(true)}>
            Adicionar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>

            <RangeFilter
              title="Vencimento"
              initialDateRange={[
                //new Date(installments.request?.dueDate?.start),
                //new Date(installments.request?.dueDate?.end),
              ]}
              //onChange={handlePeriodChange}
            />

            {/*<Filter />*/}

            <Button
              variant="outlined"
              startIcon={isFetching ? <CircularProgress size={16} /> : <i className="ri-search-line" />}
              onClick={() =>
                fetchStatements({
                  ...statements.request,
                  offset: 0
                })
              }
              disabled={isFetching}
            >
              {isFetching ? 'Pesquisando...' : 'Pesquisar'}
            </Button>
          </Box>
        </Box>

        <Box sx={styles.tableWrapper}>
          <Paper sx={styles.paperContainer}>
            <Table sx={styles.tableLayout} stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: 56, minWidth: 56, px: 1 }}>
                    <Checkbox
                      color="primary"
                      //checked={allSelected}
                      //indeterminate={selectedIds.size > 0 && !allSelected}
                      //onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Banco</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fim</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={styles.tableCellLoader}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : (
                  statements.response.rows.map((statement, index) => {
                    return (
                      <TableRow
                        key={index}
                        hover
                        //onClick={() => toggleSelect(id)}
                        role="checkbox"
                        //aria-checked={isItemSelected}
                        //selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            color="primary"
                            //checked={isItemSelected}
                            //onChange={() => toggleSelect(id)}
                          />
                        </TableCell>
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
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>


        <Box sx={styles.pagination}>
          
          <Box sx={{ minWidth: 220 }}>
            {/*selectedIds.size > 0 && (
              <Typography
                variant="subtitle1"
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  fontWeight: 500,
                  userSelect: 'none',
                }}
              >
                {selectedIds.size} registro{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
              </Typography>
            )*/}
          </Box>

          <Box sx={{ ml: 'auto' }}>
            <TablePagination
              component="div"
              labelRowsPerPage="Registros por página"
              count={statements.response?.count || 0}
              page={statements.request?.offset || 0}
              rowsPerPage={statements.request?.limit || 10}
              onPageChange={async (event, offset) =>
                await fetchStatements({
                  ...statements.request,
                  offset: offset
                })
              }
              onRowsPerPageChange={async (event) =>
                await fetchStatements({
                  ...statements.request,
                  limit: event.target.value,
                  offset: 0
                })
              }
            />
          </Box>

        </Box>

      </Box>

      <ViewAddStatement
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        onSubmit={async () => {
          setOpen(false)
          await fetchStatements({
            ...statements.request
          })
      }} />

      <ViewStatementDetail statementId={statementId} onClose={() => setStatementId(undefined)} onError={() => setStatementId(undefined)} />

    </>
  )
}