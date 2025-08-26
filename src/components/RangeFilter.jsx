'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  TextField,
} from '@mui/material'
import { DateRange } from 'react-date-range'
import {
  format,
  startOfWeek,
  endOfWeek,
  subDays,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { styles } from './styles'

export const RangeFilter = ({
  title = '',
  initialDateRange = [null, null],
  onChange,
  type = 'date', // 'date' ou 'datetime-local'
}) => {
  const today = new Date()

  // Função que cria Date a partir de string yyyy-MM-dd HH:mm(:ss)?
  // Substitui espaço por 'T' para Date.parse funcionar corretamente
  const parseDateTimeString = (dateTimeString) => {
    if (!dateTimeString) return null
    return new Date(dateTimeString.replace(' ', 'T'))
  }

  // Normaliza início do dia (00:00:00.000)
  const normalizeStartDate = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Normaliza fim do dia (23:59:59.999)
  const normalizeEndDate = (date) => {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  // Para o input HTML do MUI
  // Se for 'datetime-local' retorna formato yyyy-MM-ddTHH:mm para o input entender
  // Se for 'date' retorna yyyy-MM-dd
  const formatInputValue = (date) => {
    if (!date) return ''
    if (type === 'datetime-local') return format(date, "yyyy-MM-dd'T'HH:mm")
    return format(date, 'yyyy-MM-dd')
  }

  // Converte string do input para Date
  // Input de 'datetime-local' retorna string yyyy-MM-ddTHH:mm
  // Input de 'date' retorna yyyy-MM-dd
  const parseInputValue = (value) => {
    if (!value) return null
    // Para garantir compatibilidade, substitui 'T' por espaço para reutilizar o parser
    if (type === 'datetime-local') {
      return parseDateTimeString(value.replace('T', ' '))
    }
    // Para 'date' pode construir direto
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Estado principal do range selecionado
  const [range, setRange] = useState({
    startDate: initialDateRange[0]
      ? normalizeStartDate(parseDateTimeString(initialDateRange[0]))
      : normalizeStartDate(today),
    endDate: initialDateRange[1]
      ? normalizeEndDate(parseDateTimeString(initialDateRange[1]))
      : normalizeEndDate(today),
    key: 'selection',
  })

  // Estado temporário para editar no modal
  const [tempRange, setTempRange] = useState(range)

  // Dialog aberto ou não
  const [open, setOpen] = useState(false)

  // Atualiza o state quando mudar initialDateRange (ex: props)
  useEffect(() => {
    setRange({
      startDate: initialDateRange[0]
        ? normalizeStartDate(parseDateTimeString(initialDateRange[0]))
        : normalizeStartDate(today),
      endDate: initialDateRange[1]
        ? normalizeEndDate(parseDateTimeString(initialDateRange[1]))
        : normalizeEndDate(today),
      key: 'selection',
    })

    setTempRange({
      startDate: initialDateRange[0]
        ? normalizeStartDate(parseDateTimeString(initialDateRange[0]))
        : normalizeStartDate(today),
      endDate: initialDateRange[1]
        ? normalizeEndDate(parseDateTimeString(initialDateRange[1]))
        : normalizeEndDate(today),
      key: 'selection',
    })
  }, [initialDateRange])

  // Label para exibir no botão, comparando intervalos fixos
  const updateLabelFromDateRange = (start, end) => {
    const today = new Date()

    const comparisons = [
      {
        label: 'Hoje',
        start: normalizeStartDate(today),
        end: normalizeEndDate(today),
      },
      {
        label: 'Ontem',
        start: normalizeStartDate(subDays(today, 1)),
        end: normalizeEndDate(subDays(today, 1)),
      },
      {
        label: 'Esta semana',
        start: normalizeStartDate(startOfWeek(today, { weekStartsOn: 1 })),
        end: normalizeEndDate(endOfWeek(today, { weekStartsOn: 1 })),
      },
      {
        label: 'Semana passada',
        start: normalizeStartDate(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })),
        end: normalizeEndDate(endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })),
      },
      {
        label: 'Últimas 2 semanas',
        start: normalizeStartDate(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })),
        end: normalizeEndDate(endOfWeek(today, { weekStartsOn: 1 })),
      },
      {
        label: 'Este mês',
        start: normalizeStartDate(startOfMonth(today)),
        end: normalizeEndDate(endOfMonth(today)),
      },
      {
        label: 'Mês passado',
        start: normalizeStartDate(startOfMonth(subMonths(today, 1))),
        end: normalizeEndDate(endOfMonth(subMonths(today, 1))),
      },
      {
        label: 'Este ano',
        start: normalizeStartDate(startOfYear(today)),
        end: normalizeEndDate(endOfYear(today)),
      },
      {
        label: 'Ano passado',
        start: normalizeStartDate(startOfYear(subYears(today, 1))),
        end: normalizeEndDate(endOfYear(subYears(today, 1))),
      },
    ]

    for (const item of comparisons) {
      if (
        start.getTime() === item.start.getTime() &&
        end.getTime() === item.end.getTime()
      ) {
        return `${item.label}`
      }
    }

    // Se start e end forem o mesmo dia
    if (
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate()
    ) {
      return format(start, "d MMMM, yyyy", { locale: ptBR }) // Ex: 17 Agosto, 2025
    }

    return `${format(start, 'dd/MM/yyyy')} até ${format(end, 'dd/MM/yyyy')}`

  }

  const currentLabel = useMemo(
    () => updateLabelFromDateRange(range.startDate, range.endDate),
    [range]
  )

  // Predefined ranges para clicar e atualizar tempRange
  const predefinedRanges = [
    {
      label: 'Hoje',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(today),
          endDate: normalizeEndDate(today),
          key: 'selection',
        })
      },
    },
    {
      label: 'Ontem',
      action: () => {
        const yesterday = subDays(today, 1)
        setTempRange({
          startDate: normalizeStartDate(yesterday),
          endDate: normalizeEndDate(yesterday),
          key: 'selection',
        })
      },
    },
    {
      label: 'Esta semana',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfWeek(today, { weekStartsOn: 1 })),
          endDate: normalizeEndDate(endOfWeek(today, { weekStartsOn: 1 })),
          key: 'selection',
        })
      },
    },
    {
      label: 'Semana passada',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })),
          endDate: normalizeEndDate(endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })),
          key: 'selection',
        })
      },
    },
    {
      label: 'Últimas 2 semanas',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })),
          endDate: normalizeEndDate(endOfWeek(today, { weekStartsOn: 1 })),
          key: 'selection',
        })
      },
    },
    {
      label: 'Este mês',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfMonth(today)),
          endDate: normalizeEndDate(endOfMonth(today)),
          key: 'selection',
        })
      },
    },
    {
      label: 'Mês passado',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfMonth(subMonths(today, 1))),
          endDate: normalizeEndDate(endOfMonth(subMonths(today, 1))),
          key: 'selection',
        })
      },
    },
    {
      label: 'Este ano',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfYear(today)),
          endDate: normalizeEndDate(endOfYear(today)),
          key: 'selection',
        })
      },
    },
    {
      label: 'Ano passado',
      action: () => {
        setTempRange({
          startDate: normalizeStartDate(startOfYear(subYears(today, 1))),
          endDate: normalizeEndDate(endOfYear(subYears(today, 1))),
          key: 'selection',
        })
      },
    },
  ]

  const handleOpen = () => {
    setTempRange(range)
    setOpen(true)
  }

  const handleCancel = () => setOpen(false)

  const handleApply = () => {
    setRange(tempRange)
    setOpen(false)
    if (onChange) {
      // Sempre retorna no formato yyyy-MM-dd HH:mm (sem segundos)
      onChange([
        format(tempRange.startDate, 'yyyy-MM-dd HH:mm'),
        format(tempRange.endDate, 'yyyy-MM-dd HH:mm'),
      ])
    }
  }

  return (
    <>
      <Button
        variant="text"
        startIcon={<i className="ri-calendar-line" />}
        onClick={handleOpen}
      >
        {currentLabel}
      </Button>

      <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
        <DialogTitle>
          {title}
          <IconButton
            aria-label="close"
            onClick={handleCancel}
            sx={styles.dialogClose}
            size="large"
          >
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 4, display: 'flex', gap: 2 }}>
            {/* Botões de períodos predefinidos */}
            <Box
              sx={{ width: 220, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {predefinedRanges.map(({ label, action }) => {
                const isSelected =
                  updateLabelFromDateRange(tempRange.startDate, tempRange.endDate) === label
                return (
                  <Button
                    key={label}
                    fullWidth
                    variant={isSelected ? 'contained' : 'outlined'}
                    onClick={action}
                  >
                    {label}
                  </Button>
                )
              })}
            </Box>

            {/* Inputs + Calendário */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBR}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Data Início"
                    type={type}
                    size="small"
                    variant="filled"
                    value={formatInputValue(tempRange.startDate)}
                    onChange={(e) => {
                      const start = parseInputValue(e.target.value)
                      if (!start) return
                      setTempRange((prev) => ({
                        ...prev,
                        startDate:
                          type === 'date' ? normalizeStartDate(start) : start,
                      }))
                    }}
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Data Fim"
                    type={type}
                    size="small"
                    variant="filled"
                    value={formatInputValue(tempRange.endDate)}
                    onChange={(e) => {
                      const end = parseInputValue(e.target.value)
                      if (!end) return
                      setTempRange((prev) => ({
                        ...prev,
                        endDate:
                          type === 'date' ? normalizeEndDate(end) : end,
                      }))
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </LocalizationProvider>

              <DateRange
                editableDateInputs={false}
                onChange={(item) => setTempRange(item.selection)}
                moveRangeOnFirstSelection={false}
                ranges={[tempRange]}
                months={2}
                direction="horizontal"
                showMonthAndYearPickers
                showDateDisplay={false}
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
