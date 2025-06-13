import { getBankAccounts } from '@/views/apps/kanban/index.controller'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async Thunk
export const fetchKanbanData = createAsyncThunk(
  'kanban/fetchData',
  async () => {
    const response = await getBankAccounts()
    console.log(response)
    return response
  }
)

// Estado inicial síncrono
const initialState = {
  columns: [],
  tasks: [],
  currentTaskId: null
}

export const kanbanSlice = createSlice({
  name: 'kanban',
  initialState,
  reducers: {
    addColumn: (state, action) => {
      const maxId = Math.max(0, ...state.columns.map(col => col.id || 0))
      state.columns.push({ id: maxId + 1, title: action.payload, taskIds: [] })
    },
    editColumn: (state, action) => {
      const { id, title } = action.payload
      const column = state.columns.find(col => col.id === id)
      if (column) column.title = title
    },
    deleteColumn: (state, action) => {
      const { columnId } = action.payload
      const column = state.columns.find(col => col.id === columnId)
      state.columns = state.columns.filter(col => col.id !== columnId)
      if (column) {
        state.tasks = state.tasks.filter(task => !column.taskIds.includes(task.id))
      }
    },
    updateColumns: (state, action) => {
      state.columns = action.payload
    },
    updateColumnTaskIds: (state, action) => {
      const { id, tasksList } = action.payload
      state.columns = state.columns.map(col =>
        col.id === id ? { ...col, taskIds: tasksList.map(t => t.id) } : col
      )
    },
    addTask: (state, action) => {
      const { columnId, title } = action.payload
      const newId = state.tasks.length ? state.tasks[state.tasks.length - 1].id + 1 : 1
      const newTask = { id: newId, title }
      const column = state.columns.find(col => col.id === columnId)
      if (column) column.taskIds.push(newId)
      state.tasks.push(newTask)
    },
    editTask: (state, action) => {
      const { id, title, badgeText, dueDate } = action.payload
      const task = state.tasks.find(t => t.id === id)
      if (task) {
        task.title = title
        task.badgeText = badgeText
        task.dueDate = dueDate
      }
    },
    deleteTask: (state, action) => {
      const taskId = action.payload
      state.tasks = state.tasks.filter(task => task.id !== taskId)
      state.columns = state.columns.map(col => ({
        ...col,
        taskIds: col.taskIds.filter(id => id !== taskId)
      }))
    },
    getCurrentTask: (state, action) => {
      state.currentTaskId = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchKanbanData.fulfilled, (state, action) => {
      state.columns = action.payload.columns
      state.tasks = action.payload.tasks
    })
  }
})

export const {
  addColumn,
  editColumn,
  deleteColumn,
  updateColumns,
  updateColumnTaskIds,
  addTask,
  editTask,
  deleteTask,
  getCurrentTask
} = kanbanSlice.actions

export default kanbanSlice.reducer
