// KanbanList.jsx (agora persiste taskIds via API ao arrastar)
import { useEffect, useState, useRef } from 'react'
import Typography from '@mui/material/Typography'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'
import classnames from 'classnames'
import OptionMenu from '@core/components/option-menu'
import TaskCard from './TaskCard'
import NewTask from './NewTask'
import styles from './styles.module.css'
import { updateTaskOrder } from './index.controller'

const KanbanList = ({ column, tasks, setTasks, columns, setColumns, setDrawerOpen, currentTask, setCurrentTaskId }) => {
  const [editDisplay, setEditDisplay] = useState(false)
  const [title, setTitle] = useState(column.title)
  const prevTaskIdsRef = useRef(column.taskIds)

  const [tasksListRef, tasksList, setTasksList] = useDragAndDrop(tasks, {
    group: 'tasksList',
    plugins: [animations()],
    draggable: el => el.classList.contains('item-draggable')
  })

  const addNewTask = title => {
    const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id || 0)) : 0
    const newTask = { id: maxId + 1, title }
    setTasks(prev => [...prev, newTask])
    setTasksList(prev => [...prev, newTask])
    setColumns(prev => prev.map(col => col.id === column.id ? { ...col, taskIds: [...col.taskIds, newTask.id] } : col))
  }

  const handleSubmitEdit = e => {
    e.preventDefault()
    setEditDisplay(false)
    setColumns(prev => prev.map(col => col.id === column.id ? { ...col, title } : col))
  }

  const cancelEdit = () => {
    setEditDisplay(false)
    setTitle(column.title)
  }

  const handleDeleteColumn = () => {
    setColumns(prev => prev.filter(col => col.id !== column.id))
  }

  useEffect(() => {
    const currentTaskIds = tasksList.map(t => t.id)
    const prevTaskIds = prevTaskIdsRef.current

    if (JSON.stringify(prevTaskIds) !== JSON.stringify(currentTaskIds)) {
      const isDestination = currentTaskIds.length > prevTaskIds.length

      if (isDestination) {
        const movedTaskId = currentTaskIds.find(id => !prevTaskIds.includes(id))

        if (movedTaskId) {
          console.log('✅ Task movida:', movedTaskId)
          console.log('➡️  Coluna de destino:', column.id)
          // Aqui você pode chamar updateTaskOrder(column.id, currentTaskIds)
        }
      }

      prevTaskIdsRef.current = currentTaskIds

      setColumns(prev =>
        prev.map(col =>
          col.id === column.id ? { ...col, taskIds: currentTaskIds } : col
        )
      )
    }
  }, [tasksList])

  useEffect(() => {
    const updatedTasks = tasksList.map(task => task?.id === currentTask?.id ? currentTask : task)
    setTasksList(updatedTasks)
  }, [currentTask])

  useEffect(() => {
    const taskIds = columns.find(col => col.id === column.id)?.taskIds || []
    const filteredTasks = tasks.filter(task => task && taskIds.includes(task.id))
    setTasksList(filteredTasks)
  }, [columns])

  return (
    <div ref={tasksListRef} className='flex flex-col is-[16.5rem]'>
      {editDisplay ? (
        <form className='flex items-center mbe-4' onSubmit={handleSubmitEdit} onKeyDown={e => e.key === 'Escape' && cancelEdit()}>
          <InputBase value={title} autoFocus onChange={e => setTitle(e.target.value)} required />
          <IconButton color='success' size='small' type='submit'><i className='ri-check-line' /></IconButton>
          <IconButton color='error' size='small' type='reset' onClick={cancelEdit}><i className='ri-close-line' /></IconButton>
        </form>
      ) : (
        <div className={classnames('flex items-center justify-between is-[16.5rem] bs-[2.125rem] mbe-4', styles.kanbanColumn)}>
          <Typography variant='h5' noWrap className='max-is-[80%]'>{column.title}</Typography>
          <div className='flex items-center'>
            <i className={classnames('ri-drag-move-fill text-textSecondary list-handle', styles.drag)} />
            <OptionMenu
              iconClassName='text-xl text-textPrimary'
              options={[
                { text: 'Edit', icon: 'ri-pencil-line text-base', menuItemProps: { className: 'flex items-center gap-2', onClick: () => setEditDisplay(true) } },
                { text: 'Delete', icon: 'ri-delete-bin-line text-base', menuItemProps: { className: 'flex items-center gap-2', onClick: handleDeleteColumn } }
              ]}
            />
          </div>
        </div>
      )}
      {tasksList.map(task => task && (
        <TaskCard
          key={task.id}
          task={task}
          column={column}
          columns={columns}
          setColumns={setColumns}
          tasksList={tasksList}
          setTasksList={setTasksList}
          setDrawerOpen={setDrawerOpen}
          setCurrentTaskId={setCurrentTaskId}
          setTasks={setTasks}
        />
      ))}
      <NewTask addTask={addNewTask} />
    </div>
  )
}

export default KanbanList