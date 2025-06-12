// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import AvatarGroup from '@mui/material/AvatarGroup'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

// Third-Party Imports
import classnames from 'classnames'

// Slice Imports
import { getCurrentTask, deleteTask } from '@/redux-store/slices/kanban'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styles Imports
import styles from './styles.module.css'

export const chipColor = {
  UX: { color: 'success' },
  'Code Review': { color: 'error' },
  Dashboard: { color: 'info' },
  Images: { color: 'warning' },
  App: { color: 'secondary' },
  'Charts & Map': { color: 'primary' }
}

const TaskCard = props => {
  const {
    task,
    dispatch,
    column,
    setColumns,
    columns,
    setDrawerOpen,
    tasksList,
    setTasksList,
    isSaving = false
  } = props

  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleClick = e => {
    setMenuOpen(true)
    setAnchorEl(e.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setMenuOpen(false)
  }

  const handleTaskClick = () => {
    setDrawerOpen(true)
    dispatch(getCurrentTask(task.id))
  }

  const handleDeleteTask = () => {
    dispatch(deleteTask(task.id))
    setTasksList(tasksList.filter(taskItem => taskItem?.id !== task.id))
    const newTaskIds = column.taskIds.filter(taskId => taskId !== task.id)
    const newColumn = { ...column, taskIds: newTaskIds }
    const newColumns = columns.map(col => (col.id === column.id ? newColumn : col))
    setColumns(newColumns)
  }

  const handleDelete = () => {
    handleClose()
    handleDeleteTask()
  }

  const isOverdue = () => {
    if (!task.dueDate) return false
    const dueDateObj = new Date(task.dueDate)
    const now = new Date()
    return dueDateObj < now && !isNaN(dueDateObj.getTime())
  }

  const cardStyle = {
    backgroundColor: task.status == 'overdue' ? '#ffe6e6' : 'white'
  }

  return (
    <Card
      style={cardStyle}
      className={classnames(
        'item-draggable is-[17rem] cursor-grab active:cursor-grabbing overflow-visible mbe-4 relative',
        styles.card,
        { 'opacity-50': isSaving }
      )}
      onClick={handleTaskClick}
    >
      {/* Loading overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center rounded">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      <CardContent className='flex flex-col gap-y-3 items-start relative overflow-hidden'>
        {task.badgeText?.length > 0 && (
          <div className='flex flex-wrap items-center justify-start gap-2 is-full max-is-[85%]'>
            {task.badgeText.map((badge, index) =>
              chipColor[badge]?.color ? (
                <Chip variant='tonal' key={index} label={badge} size='small' color={chipColor[badge].color} />
              ) : null
            )}
          </div>
        )}

        {/* Menu */}
        <div className='absolute block-start-4 inline-end-3' onClick={e => e.stopPropagation()}>
          <IconButton
            aria-label='more'
            size='small'
            className={classnames(styles.menu, { [styles.menuOpen]: menuOpen })}
            aria-controls='long-menu'
            aria-haspopup='true'
            onClick={handleClick}
          >
            <i className='ri-more-2-line text-xl' />
          </IconButton>
          <Menu
            id='long-menu'
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Duplicate Task</MenuItem>
            <MenuItem onClick={handleClose}>Copy Task Link</MenuItem>
            <MenuItem onClick={handleDelete}>Delete</MenuItem>
          </Menu>
        </div>

        {task.image && <img src={task.image} alt='task' className='is-full rounded' />}

        <div className='flex flex-col gap-2 is-full'>
          <div className='flex items-center gap-2'>
            <i className='ri-file-list-2-line text-base text-primary' />
            <Typography variant='body2' color='text.secondary' className='break-words is-full line-clamp-1'>
              <strong>{task.id} #{task.financialMovement?.documentNumber} - {task.installment}</strong>
            </Typography>
          </div>

          <div className='flex items-center gap-2'>
            <i className='ri-user-line text-base text-primary' />
            <Tooltip title={task.financialMovement?.partner?.surname || ''}>
              <Typography variant='body2' color='text.secondary' className='break-words is-full line-clamp-1'>
                <strong>{task.financialMovement?.partner?.surname}</strong>
              </Typography>
            </Tooltip>
          </div>

          <div className='flex items-center gap-2'>
            <i className='ri-file-text-line text-base text-primary' />
            <Tooltip title={task.description || ''}>
              <Typography variant='body2' color='text.secondary' className='break-words is-full line-clamp-1'>
                {task.description}
              </Typography>
            </Tooltip>
          </div>

          <div className='flex justify-between items-center is-full'>
            <div className='flex items-center gap-1'>
              <i className='ri-money-dollar-circle-line text-base text-primary' />
              <Typography variant='body2' color='text.secondary'>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(task.amount || 0)}
              </Typography>
            </div>

            <div className='flex items-center gap-1'>
              <i className='ri-calendar-line text-base text-primary' />
              <Typography variant='body2' color='text.secondary'>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '-'}
              </Typography>
            </div>
          </div>
        </div>

        {(task.attachments > 0 || task.comments > 0 || (task.assigned?.length > 0)) && (
          <div className='flex justify-between items-center gap-4 is-full'>
            {(task.attachments > 0 || task.comments > 0) && (
              <div className='flex gap-4'>
                {task.attachments > 0 && (
                  <div className='flex items-center gap-1'>
                    <i className='ri-attachment-2 text-xl text-textSecondary' />
                    <Typography color='text.secondary'>{task.attachments}</Typography>
                  </div>
                )}
                {task.comments > 0 && (
                  <div className='flex items-center gap-1'>
                    <i className='ri-wechat-line text-xl text-textSecondary' />
                    <Typography color='text.secondary'>{task.comments}</Typography>
                  </div>
                )}
              </div>
            )}
            {task.assigned?.length > 0 && (
              <AvatarGroup max={4} className='pull-up'>
                {task.assigned.map((avatar, index) => (
                  <Tooltip title={avatar.name} key={index}>
                    <CustomAvatar src={avatar.src} alt={avatar.name} size={26} className='cursor-pointer' />
                  </Tooltip>
                ))}
              </AvatarGroup>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TaskCard