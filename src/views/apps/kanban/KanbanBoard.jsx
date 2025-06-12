'use client'
import { useEffect, useState } from 'react'
import { useDragAndDrop } from '@formkit/drag-and-drop/react'
import { animations } from '@formkit/drag-and-drop'

import KanbanList from './KanbanList'
import NewColumn from './NewColumn'
import KanbanDrawer from './KanbanDrawer'

const KanbanBoard = ({ initialBankAccounts = [], initialInstallments = [] }) => {

  const [columns, setColumns] = useState(initialBankAccounts)
  const [tasks, setTasks] = useState(initialInstallments)
  const [currentTaskId, setCurrentTaskId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [boardRef, orderedColumns, setOrderedColumns] = useDragAndDrop(columns, {
    plugins: [animations()],
    dragHandle: '.list-handle'
  })

  useEffect(() => {
    if (JSON.stringify(orderedColumns) !== JSON.stringify(columns)) {
      setColumns(orderedColumns)
    }
  }, [orderedColumns])

  const addNewColumn = title => {
    const maxId = columns.length > 0 ? Math.max(...columns.map(col => col.id || 0)) : 0
    const newColumn = { id: maxId + 1, title, taskIds: [] }
    setColumns(prev => [...prev, newColumn])
  }

  const updateTask = updatedTask => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task))
  }

  const deleteTask = taskId => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
    setColumns(prev => prev.map(col => ({
      ...col,
      taskIds: col.taskIds.filter(id => id !== taskId)
    })))
  }

  const currentTask = tasks.find(task => task.id === currentTaskId)

  return (
    <div className='flex items-start gap-6'>
      <div ref={boardRef} className='flex gap-6'>
        {columns.map(column => (
          <KanbanList
            key={column.id}
            column={column}
            columns={columns}
            setColumns={setColumns}
            tasks={column.taskIds
              .map(id => tasks.find(task => task.id === id))
              .filter(Boolean)}
            setTasks={setTasks}
            setDrawerOpen={setDrawerOpen}
            currentTask={currentTask}
            setCurrentTaskId={setCurrentTaskId}
          />
        ))}
      </div>
      <NewColumn addNewColumn={addNewColumn} />
      {currentTask && (
        <KanbanDrawer
          task={currentTask}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          tasks={tasks}
          setTasks={setTasks}
          columns={columns}
          setColumns={setColumns}
          setCurrentTaskId={setCurrentTaskId}
          updateTask={updateTask}
          deleteTask={deleteTask}
        />
      )}
    </div>
  )
}

export default KanbanBoard