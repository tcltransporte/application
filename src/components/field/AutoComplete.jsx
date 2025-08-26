'use client'

import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { IconButton, InputAdornment, TextField } from '@mui/material'

const AutocompleteContainer = styled.div`
  position: relative;
  width: 100%;
`

const SuggestionsBox = styled.div`
  position: absolute;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  z-index: 1300;
  border: 1px solid #ccc;
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
  color: #888;
`

export const AutoComplete = (props) => {
  
  const ref = useRef()
  const inputRef = useRef()
  const selectedItemRef = useRef()

  const [inputError, setInputError] = useState(false)
  const [inputHelperText, setInputHelperText] = useState('')
  const [state, setState] = useState({
    loading: false,
    nothing: false,
    data: [],
    query: '',
    selectedIndex: -1,
    boxPosition: null
  })

  const updateBoxPosition = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      setState(prev => ({
        ...prev,
        boxPosition: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        }
      }))
    }
  }

  const handleInputChange = async (e) => {
    try {
      setInputError(false)
      setInputHelperText('')
      const query = e?.target?.value || state.query
      setState(prev => ({
        ...prev,
        query,
        selectedIndex: 0,
        loading: true,
        nothing: false
      }))
      const data = await props.onSearch(query)
      updateBoxPosition()
      setState(prev => ({
        ...prev,
        data,
        nothing: data.length === 0
      }))
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
      setState(prev => ({
        ...prev,
        selectedIndex: Math.min(prev.selectedIndex + 1, data.length - 1)
      }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setState(prev => ({
        ...prev,
        selectedIndex: Math.max(prev.selectedIndex - 1, 0)
      }))
    } else if (e.key === 'Enter' && selectedIndex !== -1 && data[selectedIndex]) {
      e.preventDefault()
      const item = data[selectedIndex]
      if (props.onChange) {
        props.onChange(item)
      }
      setState(prev => ({ ...prev, query: '', data: [], nothing: false }))
    } else if (e.key === 'Escape') {
      if (data.length > 0 || nothing) {
        e.preventDefault()
        setState(prev => ({ ...prev, data: [], nothing: false }))
      }
    }
  }

  const handleSuggestionClick = (item) => {
    if (props.onChange) {
      props.onChange(item)
    }
    setState(prev => ({ ...prev, query: '', data: [], nothing: false }))
    inputRef.current?.focus()
  }

  const handleClickOutside = (event) => {
    if (!ref.current?.contains(event.target)) {
      setState(prev => ({ ...prev, data: [], nothing: false }))
    }
  }

  const handleClear = () => {
    if (props.onChange) {
      props.onChange(null)
    }
    setState(prev => ({ ...prev, query: '' }))
    inputRef.current?.focus()
  }

  const handleSearch = async () => {
    await handleInputChange({ target: { value: state.query } })
    inputRef.current?.focus()
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }
  }, [state.selectedIndex])

  const { label, text, children, value, autoFocus } = props
  const { query, data, selectedIndex, loading, nothing, boxPosition } = state

  const suggestionsContent = (data.length > 0 || nothing) && boxPosition && (
    <SuggestionsBox style={{
      top: boxPosition.top,
      left: boxPosition.left,
      width: boxPosition.width
    }}>
      {data.map((item, index) => (
        <Suggestion
          key={index}
          ref={index === selectedIndex ? selectedItemRef : null}
          className={index === selectedIndex ? 'selected' : ''}
          onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(item) }}
        >
          {typeof children === 'function' ? children(item) : props.renderSuggestion(item)}
        </Suggestion>
      ))}
      {nothing && (
        <Nothing onMouseDown={(e) => { e.preventDefault(); setState(prev => ({ ...prev, data: [], nothing: false })) }}>
          Nenhum resultado encontrado!
        </Nothing>
      )}
    </SuggestionsBox>
  )

  return (
    <AutocompleteContainer ref={ref}>
      <TextField
        autoComplete="off"
        size={props.size ?? 'small'}
        inputRef={inputRef}
        name={props.name}
        label={label}
        variant={props.variant ?? 'filled'}
        slotProps={{ inputLabel: { shrink: true } }}
        placeholder={!value ? props.placeholder : text(value)}
        value={value ? text(value) : query}
        fullWidth
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <IconButton size="small" edge="end" disabled>
                  <i className="ri-loader-4-line spin" style={{ fontSize: 20 }} />
                </IconButton>
              ) : value ? (
                <IconButton size="small" edge="end" onClick={handleClear} disabled={props.disabled}>
                  <i className="ri-close-line" style={{ fontSize: 20 }} />
                </IconButton>
              ) : (
                <IconButton size="small" edge="end" onClick={handleSearch}>
                  <i className="ri-search-line" style={{ fontSize: 20 }} />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
        error={props.error}
        helperText={props.helperText}
        disabled={props.disabled}
      />

      {ReactDOM.createPortal(suggestionsContent, document.body)}
    </AutocompleteContainer>
  )
}


export default AutoComplete