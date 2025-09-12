'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import { Button, Typography, Chip, IconButton, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, CircularProgress, Tooltip, Stack, Paper, Box } from '@mui/material'

import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { signOut, useSession } from 'next-auth/react'
import { getUsers, onApprove, onDisable, onDisapprove } from '@/app/server/settings/users/index.controller'
import { ViewCategorie } from './view.categorie'
import { styles } from '@/components/styles'
import { getCategories } from '@/app/server/settings/categories/index.controller'

export const Categories = () => {

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
    const updatedUsers = await getCategories()
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

  const handleEdit = id => setCompanyUserId(id)

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
                  <TableCell align='left'>Descrição</TableCell>
                  <TableCell align='left'>Tipo</TableCell>
                  <TableCell align='center'>Ações</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhuma categoria encontrada!
                    </TableCell>
                  </TableRow>
                ) : (
                  users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='flex flex-col'>
                            <Typography className='font-medium'>{row.description}</Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='flex flex-col'>
                            <Typography className='font-medium'>{row.operation == 1 ? 'Receita' : row.operation == 2 ? 'Despesa' : ''}</Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align='center'>
                        <Stack direction='row' spacing={1} justifyContent='center'>
                          <Tooltip title='Editar'>
                            <IconButton size='small' onClick={() => handleEdit(row.id)}>
                              <i className='ri-pencil-line' />
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

      <ViewCategorie
        categorieId={companyUserId}
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