'use client'

import React, { useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { IconButton, InputAdornment, TextField as MuiTextField } from '@mui/material'

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
  const abortControllerRef = useRef(null)
  // Esta flag é a chave para diferenciar um "limpar" de uma "digitação"
  const isClearingRef = useRef(false) 

  const rawError =
    (props.form?.touched?.[props.field?.name] || props.form?.submitCount > 0)
      ? props.form?.errors?.[props.field?.name]
      : undefined

  const errorMessage =
    rawError && rawError !== `${props.field?.name} is a required field`
      ? rawError
      : undefined

  const showError = Boolean(rawError)

  const [state, setState] = useState({
    loading: false,
    nothing: false,
    data: [],
    query: '',
    selectedIndex: -1,
    boxPosition: null,
  })

  const updateBoxPosition = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      setState((prev) => ({
        ...prev,
        boxPosition: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        },
      }))
    }
  }

  // Esta função é chamada ao DIGITAR
  const handleInputChange = async (e) => {
    try {
      // 1. Verifica se o 'clear' foi acionado. Se sim, para tudo.
      if (isClearingRef.current) {
        return 
      }

      // 2. Se um valor já está selecionado, não faz busca
      if (props.value || props.field?.value) return

      const query = e?.target?.value

      updateBoxPosition()

      // 3. Aborta busca anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 4. Cria novo controller (AQUI ESTAVA O ERRO DE DIGITAÇÃO)
      const controller = new AbortController() 
      abortControllerRef.current = controller

      setState((prev) => ({
        ...prev,
        query: query || '', 
        selectedIndex: 0,
        loading: true,
        nothing: false,
      }))

      // 5. FAZ A BUSCA (inclusive com string vazia, se o usuário apagar)
      const data = await props.onSearch(query || '', controller.signal)

      setState((prev) => ({
        ...prev,
        data,
        nothing: data.length === 0,
        loading: false,
      }))
    } catch (error) {
      if (error.name === 'AbortError') {
        return // requisição cancelada — ignora
      }
      console.error(error)
      setState((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleKeyDown = (e) => {
    const { selectedIndex, data, nothing } = state
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setState((prev) => ({
        ...prev,
        selectedIndex: Math.min(prev.selectedIndex + 1, data.length - 1),
      }))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setState((prev) => ({
        ...prev,
        selectedIndex: Math.max(prev.selectedIndex - 1, 0),
      }))
    } else if (e.key === 'Enter' && selectedIndex !== -1 && data[selectedIndex]) {
      e.preventDefault()
      handleSuggestionClick(data[selectedIndex])
    } else if (e.key === 'Escape') {
      if (data.length > 0 || nothing) {
        e.preventDefault()
        setState((prev) => ({ ...prev, data: [], nothing: false }))
      }
    }
  }

  const handleSuggestionClick = (item) => {
    if (props.form?.setFieldValue) {
      props.form.setFieldValue(props.field?.name, item)
    }
    if (props.onChange) {
      props.onChange(item)
    }

    setState((prev) => ({ ...prev, query: '', data: [], nothing: false }))
    inputRef.current?.focus()
  }

  const handleClickOutside = (event) => {
    if (!ref.current?.contains(event.target)) {
      setState((prev) => ({ ...prev, data: [], nothing: false }))
    }
  }

  // Esta função é chamada ao CLICAR NO (X)
  const handleClear = () => {
    // 1. ATIVA A FLAG
    isClearingRef.current = true 

    // 2. Limpa os valores (isso vai disparar o 'onChange' várias vezes)
    if (props.form?.setFieldValue) {
      props.form.setFieldValue(props.field?.name, null)
    }
    if (props.onChange) {
      props.onChange(null)
    }

    // 3. Limpa o estado interno (query, dados, etc.)
    setState((prev) => ({ ...prev, query: '', data: [], nothing: false, loading: false }))
    inputRef.current?.focus()

    // 4. DESATIVA A FLAG (só depois que todos os 'onChange' já rodaram)
    // O setTimeout(0) joga esta função para o final da fila de eventos,
    // garantindo que o handleInputChange veja 'isClearingRef.current = true'
    setTimeout(() => {
      isClearingRef.current = false
    }, 0)
  }

  // Esta função é chamada ao CLICAR NA LUPA
  const handleSearch = async () => {
    const query = state.query 
    
    try {
      updateBoxPosition()

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      setState((prev) => ({
        ...prev,
        query,
        selectedIndex: 0,
        loading: true,
        nothing: false,
      }))

      // Chama o onSearch diretamente
      const data = await props.onSearch(query, controller.signal) 

      setState((prev) => ({
        ...prev,
        data,
        nothing: data.length === 0,
        loading: false,
      }))
    } catch (error) {
      if (error.name === 'AbortError') {
        return
      }
      console.error(error)
      setState((prev) => ({ ...prev, loading: false }))
    }

    inputRef.current?.focus()
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [state.selectedIndex])

  const { query, data, selectedIndex, loading, nothing, boxPosition } = state

  const fieldName = props.field?.name
  const form = props.form

  const helperText =
    rawError && rawError !== `${fieldName} is a required field` ? rawError : ''
  const error = Boolean(rawError)

  const valueText = props.field
    ? props.field.value
      ? props.text(props.field.value)
      : query
    : props.value
    ? props.text(props.value)
    : query

  const suggestionsContent = (data.length > 0 || nothing) && boxPosition && (
    <SuggestionsBox
      style={{
        top: boxPosition.top,
        left: boxPosition.left,
        width: boxPosition.width,
      }}
    >
      {data.map((item, index) => (
        <Suggestion
          key={index}
          ref={index === selectedIndex ? selectedItemRef : null}
          className={index === selectedIndex ? 'selected' : ''}
          onMouseDown={(e) => {
            e.preventDefault()
            handleSuggestionClick(item)
          }}
        >
          {typeof props.children === 'function'
            ? props.children(item)
            : props.renderSuggestion(item)}
        </Suggestion>
      ))}
      {nothing && (
        <Nothing
          onMouseDown={(e) => {
            e.preventDefault()
            setState((prev) => ({ ...prev, data: [], nothing: false }))
          }}
        >
          Nenhum resultado encontrado!
        </Nothing>
      )}
    </SuggestionsBox>
  )

  return (
    <AutocompleteContainer ref={ref}>
      <MuiTextField
        autoComplete="off"
        size={props.size ?? 'small'}
        inputRef={inputRef}
        name={fieldName ?? props.name}
        label={props.label}
        variant={props.variant ?? 'filled'}
        value={valueText}
        onChange={handleInputChange}
        onBlur={(e) => {
          props.field?.onBlur(e)
          if (!props.value && query) setState((prev) => ({ ...prev, query: '' }))
        }}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder}
        fullWidth
        error={showError}
        helperText={errorMessage}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <IconButton tabIndex={-1} size="small" edge="end" disabled>
                  <i className="ri-loader-4-line spin" style={{ fontSize: 20 }} />
                </IconButton>
              ) : valueText ? (
                <IconButton
                  tabIndex={-1}
                  size="small"
                  edge="end"
                  onClick={handleClear}
                  disabled={props.disabled}
                >
                  <i className="ri-close-line" style={{ fontSize: 20 }} />
                </IconButton>
              ) : (
                <IconButton
                  tabIndex={-1}
                  size="small"
                  edge="end"
                  onClick={handleSearch}
                >
                  <i className="ri-search-line" style={{ fontSize: 20 }} />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        disabled={props.disabled}
      />

      {ReactDOM.createPortal(suggestionsContent, document.body)}
    </AutocompleteContainer>
  )
}

export default AutoComplete