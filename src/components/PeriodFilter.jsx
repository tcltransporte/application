'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from 'date-fns'

export const PeriodFilter = ({ title = '', initialDateRange = [null, null], onChange }) => {
  // Estado "oficial" do período selecionado
  const [range, setRange] = useState({
    startDate: initialDateRange[0] || new Date(),
    endDate: initialDateRange[1] || new Date(),
    key: 'selection',
  })

  // Estado do modal (temporário, controlado dentro do diálogo)
  const [tempRange, setTempRange] = useState(range)

  // Controle do diálogo aberto/fechado
  const [open, setOpen] = useState(false)

  // Quando inicializa ou inicialDateRange mudar, sincroniza o estado oficial
  useEffect(() => {
    const newRange = {
      startDate: initialDateRange[0] || new Date(),
      endDate: initialDateRange[1] || new Date(),
      key: 'selection',
    }
    setRange(newRange)
    setTempRange(newRange)
  }, [initialDateRange])

  // Atualiza label do botão conforme o range oficial (não o temporário do modal)
  const updateLabelFromDateRange = (start, end) => {
    const today = new Date()
    const isSameDay = (a, b) => a?.toDateString() === b?.toDateString()

    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 })
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 })

    const startOfLastWeek = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
    const endOfLastWeek = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })

    const startOfCurrentMonth = startOfMonth(today)
    const endOfCurrentMonth = endOfMonth(today)

    const startOfLastMonth = startOfMonth(subMonths(today, 1))
    const endOfLastMonth = endOfMonth(subMonths(today, 1))

    if (!start || !end) return 'Personalizado'

    if (isSameDay(start, end) && isSameDay(start, today)) {
      return 'Hoje'
    } else if (
      start.toDateString() === startOfCurrentWeek.toDateString() &&
      end.toDateString() === endOfCurrentWeek.toDateString()
    ) {
      return 'Essa semana'
    } else if (
      start.toDateString() === startOfLastWeek.toDateString() &&
      end.toDateString() === endOfLastWeek.toDateString()
    ) {
      return 'Semana passada'
    } else if (
      start.toDateString() === startOfCurrentMonth.toDateString() &&
      end.toDateString() === endOfCurrentMonth.toDateString()
    ) {
      return 'Esse mês'
    } else if (
      start.toDateString() === startOfLastMonth.toDateString() &&
      end.toDateString() === endOfLastMonth.toDateString()
    ) {
      return 'Mês passado'
    } else {
      return 'Personalizado'
    }
  }

  // Label para o botão principal, baseado no estado oficial
  const currentLabel = useMemo(() => updateLabelFromDateRange(range.startDate, range.endDate), [range])

  // Funções para atualizar tempRange dentro do modal
  const setPeriodToday = () => {
    const today = new Date()
    setTempRange({ startDate: today, endDate: today, key: 'selection' })
  }

  const setPeriodThisWeek = () => {
    const today = new Date()
    setTempRange({
      startDate: startOfWeek(today, { weekStartsOn: 1 }),
      endDate: endOfWeek(today, { weekStartsOn: 1 }),
      key: 'selection',
    })
  }

  const setPeriodLastWeek = () => {
    const today = new Date()
    setTempRange({
      startDate: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
      endDate: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
      key: 'selection',
    })
  }

  const setPeriodThisMonth = () => {
    const today = new Date()
    setTempRange({
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
      key: 'selection',
    })
  }

  const setPeriodLastMonth = () => {
    const today = new Date()
    setTempRange({
      startDate: startOfMonth(subMonths(today, 1)),
      endDate: endOfMonth(subMonths(today, 1)),
      key: 'selection',
    })
  }

  const setPeriodPersonalized = () => {
    const today = new Date()
    setTempRange({ startDate: today, endDate: today, key: 'selection' })
  }

  // Abrir o modal: reseta tempRange com range atual
  const handleOpen = () => {
    setTempRange(range)
    setOpen(true)
  }

  // Cancelar: fecha modal sem alterar o estado oficial
  const handleCancel = () => {
    setOpen(false)
  }

  // Aplicar: atualiza estado oficial e dispara onChange
  const handleApply = () => {
    setRange(tempRange)
    setOpen(false)
    if (onChange) onChange([format(tempRange.startDate, "yyyy-MM-dd HH:mm"), format(tempRange.endDate, "yyyy-MM-dd HH:mm")])
  }

  return (
    <>
      <Button variant="text" startIcon={<i className="ri-calendar-line" />} onClick={handleOpen}>
        {currentLabel}
      </Button>

      <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
            <Button
              variant={updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === 'Mês passado' ? 'contained' : 'outlined'}
              onClick={setPeriodLastMonth}
            >
              Mês passado
            </Button>
            <Button
              variant={updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === 'Semana passada' ? 'contained' : 'outlined'}
              onClick={setPeriodLastWeek}
            >
              Semana passada
            </Button>
            <Button
              variant={updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === 'Hoje' ? 'contained' : 'outlined'}
              onClick={setPeriodToday}
            >
              Hoje
            </Button>
            <Button
              variant={updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === 'Essa semana' ? 'contained' : 'outlined'}
              onClick={setPeriodThisWeek}
            >
              Essa semana
            </Button>
            <Button
              variant={updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === 'Esse mês' ? 'contained' : 'outlined'}
              onClick={setPeriodThisMonth}
            >
              Esse mês
            </Button>
            <Button
              variant={updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === 'Personalizado' ? 'contained' : 'outlined'}
              onClick={setPeriodPersonalized}
            >
              Personalizado
            </Button>
          </Box>

          <DateRange
            editableDateInputs={true}
            onChange={(item) => setTempRange(item.selection)}
            moveRangeOnFirstSelection={false}
            ranges={[tempRange]}
            months={2}
            direction="horizontal"
            showMonthAndYearPickers={true}
            showDateDisplay={true}
            rangeColors={['#3f51b5']}
            fixedHeight={false}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel}>Cancelar</Button>
          <Button variant="contained" onClick={handleApply} startIcon={<i className="ri-check-line" />}>
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}