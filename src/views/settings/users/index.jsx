'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import {
  Card,
  Divider,
  Button,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  CircularProgress,
  Tooltip,
  Stack,
  Paper,
  Box
} from '@mui/material'

import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/utils/getInitials'
import { signOut, useSession } from 'next-auth/react'
import { getUsers, onApprove, onDisable, onDisapprove } from '@/app/server/settings/users/index.controller'
import { ViewUser } from './view.user'
import { styles } from '@/components/styles'

export const Users = () => {

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState({})
  const [companyUserId, setCompanyUserId] = useState(undefined)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { data: session } = useSession()

  useEffect(() => {
    onSearch()
  }, [])

  const fetchUsers = async () => {
    const updatedUsers = await getUsers()
    setUsers(updatedUsers)
  }

  const onSearch = async () => {
    try {
      setLoading(true)
      await fetchUsers()
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async id => {
    setLoadingStatus(prev => ({ ...prev, [id]: true }))
    await onApprove({ id })
    await fetchUsers()
    setLoadingStatus(prev => ({ ...prev, [id]: false }))
  }

  const handleDisapprove = async id => {
    setLoadingStatus(prev => ({ ...prev, [id]: true }))
    await onDisapprove({ id })
    await fetchUsers()
    setLoadingStatus(prev => ({ ...prev, [id]: false }))
  }

  const handleEdit = id => setCompanyUserId(id)

  const handleDisable = async ({ id, userId }) => {
    setLoadingStatus(prev => ({ ...prev, [id]: true }))
    await onDisable({ id })
    if (userId === session?.user?.userId) return signOut({ callbackUrl: '/login' })
    await fetchUsers()
    setLoadingStatus(prev => ({ ...prev, [id]: false }))
  }

  const getAvatar = ({ avatar, fullName }) => (
    avatar ? <CustomAvatar src={avatar} skin='light' size={34} /> : <CustomAvatar skin='light' size={34}>{getInitials(fullName)}</CustomAvatar>
  )

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
                  <TableCell>Usuário</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell align='center'>Status</TableCell>
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
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          {getAvatar({ avatar: row.avatar, fullName: row.fullName })}
                          <div className='flex flex-col'>
                            <Typography className='font-medium'>{row.user.userName}</Typography>
                            <Typography variant='body2'>{row.user.userName}</Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.user.userMember?.email}</TableCell>
                      <TableCell align='center'>
                        {loadingStatus[row.id] ? <CircularProgress size={20} /> : (
                          row.isActive === true ? <Chip label='Ativo' size='small' color='success' /> :
                          row.isActive === false ? <Chip label='Inativo' size='small' color='error' /> :
                          <Chip label='Pendente' size='small' color='warning' />
                        )}
                      </TableCell>
                      <TableCell align='center'>
                        <Stack direction='row' spacing={1} justifyContent='center'>
                          <Tooltip title='Editar'>
                            <IconButton size='small' onClick={() => handleEdit(row.id)}>
                              <i className='ri-pencil-line' />
                            </IconButton>
                          </Tooltip>

                          {row.isActive === true && (
                            <Tooltip title='Desativar'>
                              <IconButton size='small' onClick={() => handleDisable({ id: row.id, userId: row.user.userId })}>
                                <i className='ri-user-unfollow-line' />
                              </IconButton>
                            </Tooltip>
                          )}

                          {row.isActive === false && (
                            <Tooltip title='Ativar'>
                              <IconButton size='small' onClick={() => handleApprove(row.id)}>
                                <i className='ri-user-follow-line' />
                              </IconButton>
                            </Tooltip>
                          )}

                          {row.isActive !== true && row.isActive !== false && (
                            <>
                              <Tooltip title='Aprovar'>
                                <IconButton size='small' color='success' onClick={() => handleApprove(row.id)}>
                                  <i className='ri-check-line' />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Reprovar'>
                                <IconButton size='small' color='error' onClick={() => handleDisapprove(row.id)}>
                                  <i className='ri-close-line' />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
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
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </Box>

      </Box>

      <ViewUser
        companyUserId={companyUserId}
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