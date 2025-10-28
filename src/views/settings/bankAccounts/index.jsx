'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import { Button, IconButton, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, CircularProgress, Tooltip, Stack, Paper, Box } from '@mui/material'

import { ViewBankAccount } from './view.bankAccount'
import { styles } from '@/components/styles'
import * as bankAccount from '@/app/server/settings/bank-accounts'

export const BankAccounts = () => {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState({})
  const [companyUserId, setCompanyUserId] = useState(undefined)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)

  useEffect(() => {
    onSearch()
  }, [])

  const fetchCategories = async () => {
    const updatedUsers = await bankAccount.findAll()
    setUsers(updatedUsers)
  }

  const onSearch = async () => {
    try {
      setLoading(true)
      await fetchCategories()
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = codigo_conta_bancaria => setCompanyUserId(codigo_conta_bancaria)

  return (
    <>
      <Box sx={styles.container}>
        <Box sx={styles.header}>
          <Button
            className='max-sm:is-full'
            variant='contained'
            startIcon={<i className='ri-add-circle-line' />}
            onClick={() => setCompanyUserId(null)}
          >
            Adicionar
          </Button>
        </Box>

        <Box sx={styles.tableWrapper}>
          <Paper sx={styles.paperContainer}>
            <Table sx={styles.tableLayout} stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell align='left'>Banco</TableCell>
                  <TableCell align='left'>Agência</TableCell>
                  <TableCell align='left'>Conta</TableCell>
                  <TableCell align='center'>Ações</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhum conta bancária encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {row.bank?.icon && (
                            <img 
                              src={row.bank.icon} 
                              alt={row.bank?.name} 
                              style={{ width: 24, height: 24, borderRadius: '50%' }}
                            />
                          )}
                          <span>{row.name}</span>
                        </Stack>
                      </TableCell>
                      
                      <TableCell>{row.agency}</TableCell>
                      <TableCell>{row.number}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleEdit(row.codigo_conta_bancaria)}>
                              <i className="ri-pencil-line" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>

        <Box sx={styles.pagination}>
          <Box sx={{ ml: 'auto' }}>
            <TablePagination
              component='div'
              count={users.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 25))
                setPage(0)
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Box>

      </Box>

      <ViewBankAccount
        bankAccountId={companyUserId}
        onClose={(isUpdated) => {
          setCompanyUserId(undefined)
          if (isUpdated) {
            onSearch()
          }
        }}
      />

    </>
  )
}