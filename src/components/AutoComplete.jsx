'use client'

import React, { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import _ from 'lodash'
import { IconButton, InputAdornment, TextField } from '@mui/material'

const AutocompleteContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 100%;
`

const SuggestionsBox = styled.div`
  max-height: 300px;
  width: 100%;
  overflow-y: auto;
  position: fixed;  /* fixo na viewport */
  background-color: white;
  z-index: 1300; /* maior que modal do MUI (1300 padrão) */
  border: 1px solid #ccc;
  border-top: none;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  border-radius: 0 0 4px 4px;
`

const Suggestion = styled.div`
  padding: 6px;
  cursor: pointer;
  &:hover,
  &.selected {
    color: white;
    background-color: dodgerblue;
  }
`

const Nothing = styled.div`
  padding: 6px;
`

export const AutoComplete = (props) => {
  const [inputError, setInputError] = useState(false)
  const [inputHelperText, setInputHelperText] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  const textFieldRef = useRef()
  const inputRef = useRef()
  const suggestionsBoxRef = useRef()
  const selectedItemRef = useRef()

  const [state, setState] = useState({
    loading: false,
    nothing: false,
    data: [],
    query: '',
    selectedIndex: -1,
  })

  // Atualiza a posição do SuggestionsBox
  const updatePosition = () => {
    if (!textFieldRef.current) return
    const rect = textFieldRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true) // captura scroll em containers também

    updatePosition()

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [])

  useEffect(() => {
    // Atualiza a posição sempre que abrir sugestões ou muda query
    if (state.data.length || state.nothing) {
      updatePosition()
    }
  }, [state.data, state.nothing])

  const handleSearch = async () => {
    await handleInputChange()
    inputRef.current.focus()
  }

  const handleInputChange = async (e) => {
    try {
      setInputError(false)
      setInputHelperText('')

      const query = e?.target?.value || ''
      setState(prev => ({ ...prev, query, selectedIndex: 0, loading: true, nothing: false }))
      const data = await props.onSearch(query)
      setState(prev => ({ ...prev, data, nothing: _.size(data) === 0 }))
    } catch (error) {
      setInputError(true)
      setInputHelperText(error.message || 'Erro desconhecido')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleKeyDown = (e) => {
    const { selectedIndex, data, nothing } = state

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setState(prev => ({ ...prev, selectedIndex: Math.min(prev.selectedIndex + 1, data.length - 1) }))
      scrollToSelectedItem()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setState(prev => ({ ...prev, selectedIndex: Math.max(prev.selectedIndex - 1, 0) }))
      scrollToSelectedItem()
    } else if (e.key === 'Enter' && selectedIndex !== -1) {
      e.preventDefault()
      handleSuggestionClick(data[selectedIndex])
      setState(prev => ({ ...prev, data: [] }))
    } else if (e.key === 'Escape') {
      if (data.length > 0 || nothing) {
        e.preventDefault()
        setState(prev => ({ ...prev, data: [], nothing: false }))
      }
    }
  }

  const scrollToSelectedItem = () => {
    if (selectedItemRef.current && suggestionsBoxRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }

  const handleBlur = () => {
    setState(prev => ({ ...prev, query: '', data: [], nothing: false }))
  }

  const handleClickOutside = (event) => {
    if (
      suggestionsBoxRef.current &&
      !suggestionsBoxRef.current.contains(event.target) &&
      textFieldRef.current &&
      !textFieldRef.current.contains(event.target)
    ) {
      setState(prev => ({ ...prev, query: '', data: [], nothing: false }))
    }
  }

  const handleSuggestionClick = (item) => {
    props.onChange(item)
    setState(prev => ({ ...prev, query: '', data: [], nothing: false }))
  }

  const handleClear = () => {
    setState(prev => ({ ...prev, query: '' }))
    props.onChange(null)
    inputRef.current?.focus()
  }

  const { label, text, value, children, autoFocus } = props
  const { query, data, selectedIndex, loading, nothing } = state

  return (
    <AutocompleteContainer>
      <TextField
        autoComplete='off'
        size={props.size ?? 'medium'}
        ref={textFieldRef}
        inputRef={inputRef}
        name={props.name}
        label={label}
        variant={props.variant ?? 'filled'}
        slotProps={{ inputLabel: { shrink: true } }}
        placeholder={!value ? props.placeholder : text(value)}
        value={query}
        type="text"
        fullWidth
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        sx={{
          ...(value && {
            '& input::placeholder': {
              color: 'currentColor',
              opacity: 1,
            },
          }),
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <IconButton size="small" edge="end" disabled>
                  <i className="ri-loader-4-line spin" style={{ fontSize: 20 }} />
                </IconButton>
              ) : value ? (
                <IconButton size="small" edge="end" onClick={handleClear} aria-label="clear input" disabled={props.disabled}>
                  <i className="ri-close-line" style={{ fontSize: 20 }} />
                </IconButton>
              ) : (
                <IconButton size="small" edge="end" aria-label="search icon" onClick={handleSearch}>
                  <i className="ri-search-line" style={{ fontSize: 20 }} />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
        error={inputError || props.error}
        helperText={inputHelperText || props.helperText}
        disabled={props.disabled}
      />

      <SuggestionsBox
        ref={suggestionsBoxRef}
        style={{
          display: _.size(data) || nothing ? 'block' : 'none',
          top: position.top,
          left: position.left,
          width: position.width,
        }}
        tabIndex={-1}
      >
        {_.map(data, (item, index) => (
          <Suggestion
            key={index}
            ref={index === selectedIndex ? selectedItemRef : null}
            className={index === selectedIndex ? 'selected' : ''}
            onMouseDown={() => handleSuggestionClick(item)}
          >
            {typeof children === 'function' ? children(item) : null}
          </Suggestion>
        ))}

        {nothing && (
          <Nothing onMouseDown={handleBlur}>
            Nenhum resultado encontrado!
          </Nothing>
        )}
      </SuggestionsBox>
    </AutocompleteContainer>
  )
}
