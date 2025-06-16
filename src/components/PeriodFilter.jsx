'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton
} from '@mui/material'
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
  startOfYear,
  endOfYear,
  subYears,
  subDays,
  format
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { styles } from './styles'

export const PeriodFilter = ({ title = '', initialDateRange = [null, null], onChange }) => {
  const [range, setRange] = useState({
    startDate: new Date(initialDateRange[0]) || new Date(),
    endDate: new Date(initialDateRange[1]) || new Date(),
    key: 'selection'
  })

  const [tempRange, setTempRange] = useState(range)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const newRange = {
      startDate: new Date(initialDateRange[0]) || new Date(),
      endDate: new Date(initialDateRange[1]) || new Date(),
      key: 'selection'
    }
    setRange(newRange)
    setTempRange(newRange)
  }, [initialDateRange])

  const updateLabelFromDateRange = (start, end) => {
    const today = new Date()
    const isSameDay = (a, b) => a?.toDateString() === b?.toDateString()

    const comparisons = [
      {
        label: 'Hoje',
        start: today,
        end: today
      },
      {
        label: 'Ontem',
        start: subDays(today, 1),
        end: subDays(today, 1)
      },
      {
        label: 'Esta semana',
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      },
      {
        label: 'Semana passada',
        start: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
      },
      {
        label: 'Últimas 2 semanas',
        start: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      },
      {
        label: 'Este mês',
        start: startOfMonth(today),
        end: endOfMonth(today)
      },
      {
        label: 'Mês passado',
        start: startOfMonth(subMonths(today, 1)),
        end: endOfMonth(subMonths(today, 1))
      },
      {
        label: 'Este ano',
        start: startOfYear(today),
        end: endOfYear(today)
      },
      {
        label: 'Ano passado',
        start: startOfYear(subYears(today, 1)),
        end: endOfYear(subYears(today, 1))
      },
    ]

    for (const item of comparisons) {
      if (
        start.toDateString() === item.start.toDateString() &&
        end.toDateString() === item.end.toDateString()
      ) {
        return item.label
      }
    }

    return 'Personalizado'
  }

  const currentLabel = useMemo(
    () =>
      updateLabelFromDateRange(new Date(range.startDate), new Date(range.endDate)),
    [range]
  )

  const predefinedRanges = [
    {
      label: 'Hoje',
      action: () => {
        const today = new Date()
        setTempRange({ startDate: today, endDate: today, key: 'selection' })
      }
    },
    {
      label: 'Ontem',
      action: () => {
        const yesterday = subDays(new Date(), 1)
        setTempRange({ startDate: yesterday, endDate: yesterday, key: 'selection' })
      }
    },
    {
      label: 'Esta semana',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfWeek(today, { weekStartsOn: 1 }),
          endDate: endOfWeek(today, { weekStartsOn: 1 }),
          key: 'selection'
        })
      }
    },
    {
      label: 'Semana passada',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
          endDate: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
          key: 'selection'
        })
      }
    },
    {
      label: 'Últimas 2 semanas',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
          endDate: endOfWeek(today, { weekStartsOn: 1 }),
          key: 'selection'
        })
      }
    },
    {
      label: 'Este mês',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfMonth(today),
          endDate: endOfMonth(today),
          key: 'selection'
        })
      }
    },
    {
      label: 'Mês passado',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfMonth(subMonths(today, 1)),
          endDate: endOfMonth(subMonths(today, 1)),
          key: 'selection'
        })
      }
    },
    {
      label: 'Este ano',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfYear(today),
          endDate: endOfYear(today),
          key: 'selection'
        })
      }
    },
    {
      label: 'Ano passado',
      action: () => {
        const today = new Date()
        setTempRange({
          startDate: startOfYear(subYears(today, 1)),
          endDate: endOfYear(subYears(today, 1)),
          key: 'selection'
        })
      }
    }
  ]

  const handleOpen = () => {
    setTempRange(range)
    setOpen(true)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  const handleApply = () => {
    setRange(tempRange)
    setOpen(false)
    if (onChange) {
      onChange([
        format(tempRange.startDate, 'yyyy-MM-dd HH:mm'),
        format(tempRange.endDate, 'yyyy-MM-dd HH:mm')
      ])
    }
  }

  return (
    <>
      <Button variant="text" startIcon={<i className="ri-calendar-line" />} onClick={handleOpen}>
        {currentLabel}
      </Button>

      <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
        <DialogTitle sx={styles.dialogTitle}>
          {title}
          <IconButton aria-label="close" onClick={handleCancel} sx={styles.dialogClose} size="large">
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} sx={{pt: 4}}>
            
            <Box width="220px" display="flex" flexDirection="column" gap={1}>
              {predefinedRanges.map(({ label, action }) => (
                <Button
                  key={label}
                  fullWidth
                  variant={
                    updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === label
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={action}
                >
                  {label}
                </Button>
              ))}
            </Box>

            <Box flex={1}>
              <DateRange
                editableDateInputs
                onChange={(item) => setTempRange(item.selection)}
                moveRangeOnFirstSelection={false}
                ranges={[tempRange]}
                months={2}
                direction="horizontal"
                showMonthAndYearPickers
                showDateDisplay
                rangeColors={['var(--mui-palette-primary-main)']}
                locale={ptBR}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleApply}
            startIcon={<i className="ri-check-line" />}
          >
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
