'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import { Stack, Tooltip, CircularProgress } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
//import { getUsers, onApprove, onDisable, onDisapprove } from './index.controller'
import { ViewUser } from './view.user'
import { signOut, useSession } from 'next-auth/react'
import { getUsers, onApprove, onDisable, onDisapprove } from '@/app/server/settings/users/index.controller'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper()

export const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState({})
  const [companyUserId, setCompanyUserId] = useState(undefined)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [hoveredRowId, setHoveredRowId] = useState(null)

  const { data: session } = useSession()

  const fetchUsers = async () => {
    const updatedUsers = await getUsers()
    setUsers(updatedUsers)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchUsers()
      setLoading(false)
    }

    load()
  }, [])

  const handleApprove = async (id) => {
    setLoadingStatus(prev => ({ ...prev, [id]: true }))
    await onApprove({ id })
    await fetchUsers()
    setLoadingStatus(prev => ({ ...prev, [id]: false }))
  }

  const handleDisapprove = async (id) => {
    setLoadingStatus(prev => ({ ...prev, [id]: true }))
    await onDisapprove({ id })
    await fetchUsers()
    setLoadingStatus(prev => ({ ...prev, [id]: false }))
  }

  const handleEdit = async (id) => {
    setCompanyUserId(id)
  }

  const handleDisable = async ({ id, userId }) => {
    setLoadingStatus(prev => ({ ...prev, [id]: true }))
    await onDisable({ id })

    const currentUserId = session?.user?.userId

    if (userId === currentUserId) {
      await signOut({ callbackUrl: '/login' })
      return
    }

    await fetchUsers()
    setLoadingStatus(prev => ({ ...prev, [id]: false }))
  }

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    columnHelper.accessor('fullName', {
      header: 'User',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          {getAvatar({ avatar: row.original.avatar, fullName: row.original.fullName })}
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.user.userName}
            </Typography>
            <Typography variant='body2'>{row.original.user.userName}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: ({ row }) => <Typography>{row.original.user.userMember?.email}</Typography>
    }),
    columnHelper.accessor('status', {
      header: () => <div style={{ textAlign: 'center' }}>Status</div>,
      cell: ({ row }) => {
        const status = row.original.isActive
        const isHovered = hoveredRowId === row.id
        const id = row.original.id

        if (loadingStatus[id]) {
          return <div style={{ display: 'flex', justifyContent: 'center' }}><CircularProgress size={20} /></div>
        }

        if (status === true) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Chip variant='tonal' label='Ativo' size='small' color='success' className='capitalize' style={{ minWidth: 120 }} />
            </div>
          )
        }

        if (status === false) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Chip variant='tonal' label='Inativo' size='small' color='error' className='capitalize' style={{ minWidth: 120 }} />
            </div>
          )
        }

        if (!isHovered) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Chip variant='tonal' label='Pendente' size='small' color='warning' className='capitalize' style={{ minWidth: 120 }} />
            </div>
          )
        }

        return (
          <Stack direction="row" spacing={1} justifyContent="center">
            <Tooltip title="Aprovar">
              <IconButton size="small" color="success" onClick={() => handleApprove(id)}>
                <i className="ri-check-line" style={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reprovar">
              <IconButton size="small" color="error" onClick={() => handleDisapprove(id)}>
                <i className="ri-close-line" style={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    }),
    columnHelper.accessor('action', {
      header: '',
      cell: ({ row }) => {
        const status = row.original.isActive
        const id = row.original.id
        const userId = row.original.user.userId
        const isHovered = hoveredRowId === row.id

        if (!isHovered) return null

        return (
          <div className="flex gap-2">
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => handleEdit(id)}>
                <i className="ri-pencil-line text-textSecondary" />
              </IconButton>
            </Tooltip>

            {status === true && (
              <Tooltip title="Desativar">
                <IconButton size="small" onClick={() => handleDisable({ id, userId })}>
                  <i className="ri-user-unfollow-line text-textSecondary" />
                </IconButton>
              </Tooltip>
            )}

            {status === false && (
              <Tooltip title="Ativar">
                <IconButton size="small" onClick={() => handleApprove(id)}>
                  <i className="ri-user-follow-line text-textSecondary" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )
      },
      enableSorting: false
    })
  ], [hoveredRowId, loadingStatus])

  const table = useReactTable({
    data: users,
    columns,
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = ({ avatar, fullName }) => {
    return avatar ? (
      <CustomAvatar src={avatar} skin='light' size={34} />
    ) : (
      <CustomAvatar skin='light' size={34}>{getInitials(fullName)}</CustomAvatar>
    )
  }

  return (
    <>
      <Card>
        <Divider />
        <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
          <Button 
            className='max-sm:is-full'
            variant="contained"
            sx={{ mb: 2 }}
            startIcon={<i className="ri-add-circle-line" />} 
            onClick={() => setCompanyUserId(null)}
          >
            Adicionar
          </Button>
        </div>

        <div className='overflow-x-auto'>
          {loading ? (
            <div className='flex justify-center items-center p-10'>
              <CircularProgress />
            </div>
          ) : (
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} colSpan={header.colSpan} style={{ minWidth: 120 }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>Nenhum dado disponível</td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.slice(0, table.getState().pagination.pageSize).map(row => (
                    <tr
                      key={row.id}
                      className={classnames({ selected: row.getIsSelected() })}
                      onMouseEnter={() => setHoveredRowId(row.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          )}
        </div>

        <Divider />

        {!loading && (
          <TablePagination
            component='div'
            count={table.getFilteredRowModel().rows.length}
            page={table.getState().pagination.pageIndex}
            onPageChange={(e, page) => table.setPageIndex(page)}
            rowsPerPage={table.getState().pagination.pageSize}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
          />
        )}
      </Card>

      <ViewUser companyUserId={companyUserId} onClose={() => setCompanyUserId(undefined)} onSubmit={fetchUsers} />

    </>
  )
}
