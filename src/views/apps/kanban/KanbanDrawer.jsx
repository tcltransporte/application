// KanbanDrawer.jsx (Corrigido loop infinito no useEffect)
import { useEffect, useState, useRef } from 'react'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'
import { useForm, Controller } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { minLength, nonEmpty, object, pipe, string } from 'valibot'
import CustomAvatar from '@core/components/mui/Avatar'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { chipColor } from './TaskCard'

const schema = object({
  title: pipe(string(), nonEmpty('Title is required'), minLength(1))
})

const KanbanDrawer = ({ drawerOpen, setDrawerOpen, task, tasks, setTasks, columns, setColumns, setCurrentTaskId, updateTask, deleteTask }) => {
  const [date, setDate] = useState(task.dueDate)
  const [badgeText, setBadgeText] = useState(task.badgeText || [])
  const [fileName, setFileName] = useState('')
  const [comment, setComment] = useState('')
  const fileInputRef = useRef(null)

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: task.title },
    resolver: valibotResolver(schema)
  })

  const handleClose = () => {
    setDrawerOpen(false)
    reset({ title: task.title })
    setBadgeText(task.badgeText || [])
    setDate(task.dueDate)
    setFileName('')
    setComment('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileUpload = e => {
    const { files } = e.target
    if (files?.length) setFileName(files[0].name)
  }

  const handleUpdate = data => {
    updateTask({ ...task, title: data.title, badgeText, dueDate: date })
    handleClose()
  }

  const handleDelete = () => {
    deleteTask(task.id)
    handleClose()
    setCurrentTaskId(null)
  }

  useEffect(() => {
    if (!drawerOpen) return
    reset({ title: task.title })
    setBadgeText(task.badgeText || [])
    setDate(task.dueDate)
  }, [drawerOpen])

  return (
    <Drawer open={drawerOpen} anchor='right' variant='temporary' ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }} onClose={handleClose}>
      <div className='flex justify-between items-center pli-5 plb-4 border-be'>
        <Typography variant='h5'>Edit Task</Typography>
        <IconButton onClick={handleClose} size='small'>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <div className='p-6'>
        <form className='flex flex-col gap-y-5' onSubmit={handleSubmit(handleUpdate)}>
          <Controller name='title' control={control} render={({ field }) => (
            <TextField fullWidth label='Title' {...field} error={Boolean(errors.title)} helperText={errors.title?.message} />
          )} />

          <AppReactDatepicker selected={date ? new Date(date) : new Date()} onChange={date => date && setDate(date)} placeholderText='Click to select a date' customInput={<TextField label='Due Date' fullWidth />} />

          <FormControl fullWidth>
            <InputLabel id='demo-multiple-chip-label'>Label</InputLabel>
            <Select multiple label='Label' value={badgeText || []} onChange={e => setBadgeText(e.target.value)} renderValue={selected => (
              <div className='flex flex-wrap gap-1'>
                {selected.map(value => (
                  <Chip key={value} label={value} onDelete={() => setBadgeText(prev => prev.filter(v => v !== value))} size='small' variant='tonal' color={chipColor[value]?.color} />
                ))}
              </div>
            )}>
              {Object.keys(chipColor).map(chip => (
                <MenuItem key={chip} value={chip}>
                  <Checkbox checked={badgeText.includes(chip)} />
                  <ListItemText primary={chip} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className='flex flex-col gap-y-1'>
            <Typography variant='body2'>Assigned</Typography>
            <div className='flex gap-1'>
              {task.assigned?.map((avatar, i) => (
                <Tooltip title={avatar.name} key={i}>
                  <CustomAvatar src={avatar.src} size={26} className='cursor-pointer' />
                </Tooltip>
              ))}
              <CustomAvatar size={26} className='cursor-pointer'>
                <i className='ri-add-line text-base text-textSecondary' />
              </CustomAvatar>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <TextField fullWidth label='Choose File' value={fileName} variant='outlined' slotProps={{ input: { readOnly: true, endAdornment: fileName && (
              <InputAdornment position='end'>
                <IconButton size='small' edge='end' onClick={() => setFileName('')}>
                  <i className='ri-close-line' />
                </IconButton>
              </InputAdornment>
            ) } }} />
            <Button component='label' variant='outlined'>Choose
              <input hidden type='file' onChange={handleFileUpload} ref={fileInputRef} />
            </Button>
          </div>

          <TextField fullWidth label='Comment' multiline rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder='Write a Comment....' />

          <div className='flex gap-4'>
            <Button variant='contained' color='primary' type='submit'>Update</Button>
            <Button variant='outlined' color='error' type='reset' onClick={handleDelete}>Delete</Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default KanbanDrawer