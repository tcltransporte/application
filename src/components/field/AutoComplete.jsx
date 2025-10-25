'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { IconButton, InputAdornment, TextField as MuiTextField } from '@mui/material'

// --- Styled Components (sem alteração) ---

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

// --- Hook de Debounce (sem alteração) ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); 

  return debouncedValue;
}


// --- Componente Principal ---

export const AutoComplete = (props) => {
  // --- Refs ---
  const ref = useRef()
  const inputRef = useRef()
  const selectedItemRef = useRef()
  const abortControllerRef = useRef(null)
  const isClearingRef = useRef(false)
  const isInitialMount = useRef(true);

  // --- Props ---
  const { 
    field, 
    form, 
    text, 
    onSearch, 
    onChange, 
    children, 
    renderSuggestion, 
    ...rest 
  } = props
  
  const value = field?.value || props.value
  const name = field?.name || props.name

  // --- Lógica de Erro (Formik) ---
  const rawError =
    (form?.touched?.[name] || form?.submitCount > 0)
      ? form?.errors?.[name]
      : undefined

  const errorMessage =
    rawError && rawError !== `${name} is a required field`
      ? rawError
      : undefined

  const showError = Boolean(rawError)

  // --- Estado ---
  const [query, setQuery] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [nothing, setNothing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [boxPosition, setBoxPosition] = useState(null)
  
  // --- Debounce ---
  const debouncedQuery = useDebounce(query, 300);
  
  // --- Variáveis Derivadas ---
  const valueText = value ? text(value) : query
  const isBoxOpen = data.length > 0 || nothing

  // --- Handlers (Memoizados com useCallback) ---

  const updateBoxPosition = useCallback(() => {
    const rect = ref.current?.getBoundingClientRect()
    if (rect) {
      setBoxPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [])

  /**
   * Chamado ao digitar no input (onChange)
   */
  const handleInputChange = useCallback((e) => {
    if (isClearingRef.current) return
    if (value) return

    const newQuery = e.target.value
    setQuery(newQuery)
    
    // 👇 *** MUDANÇA 1: Ativa o loading IMEDIATAMENTE ***
    setLoading(true)
    
  }, [value]) 

  /**
   * Chamado ao clicar no (X) para limpar
   */
  const handleClear = useCallback((e) => {
    e.preventDefault() 
    isClearingRef.current = true // ATIVA A FLAG

    if (form?.setFieldValue) {
      form.setFieldValue(name, null)
    }
    if (onChange) {
      onChange(null)
    }

    setQuery('')
    setData([])
    setNothing(false)
    setLoading(false) // Desliga o loading imediatamente
    setSelectedIndex(-1)
    inputRef.current?.focus()
    
  }, [form, name, onChange])

  /**
   * Chamado ao clicar na (Lupa) para buscar (IMEDIATO)
   */
  const handleSearch = useCallback(async (e) => {
    e.preventDefault()

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true) // Ativa o loading
      setNothing(false)
      setSelectedIndex(0)

      const resultData = await onSearch(query, controller.signal) 

      setData(resultData)
      setNothing(resultData.length === 0)
      setLoading(false) // Desliga o loading no sucesso

    } catch (error) {
      if (error.name === 'AbortError') return
      console.error(error)
      setLoading(false) // Desliga o loading no erro
    }

    inputRef.current?.focus()
  }, [onSearch, query]) 

  const handleSuggestionClick = useCallback((item) => {
    if (form?.setFieldValue) {
      form.setFieldValue(name, item)
    }
    if (onChange) {
      onChange(item)
    }

    setQuery('')
    setData([])
    setNothing(false)
    setLoading(false) // Desliga o loading ao selecionar
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [form, name, onChange])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, data.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && selectedIndex !== -1 && data[selectedIndex]) {
      e.preventDefault()
      handleSuggestionClick(data[selectedIndex])
    } else if (e.key === 'Escape') {
      if (isBoxOpen) {
        e.preventDefault()
        setData([])
        setNothing(false)
        setLoading(false) // Desliga o loading ao pressionar ESC
      }
    }
  }, [data, selectedIndex, isBoxOpen, handleSuggestionClick])

  const handleClickOutside = useCallback((event) => {
    if (!ref.current?.contains(event.target)) {
      setData([])
      setNothing(false)
      // Não desliga o loading aqui, a busca pode estar em andamento
    }
  }, [])


  // --- Efeitos (useEffect) ---
  
  /**
   * 👇 *** MUDANÇA 2: useEffect da BUSCA COM DEBOUNCE ***
   */
  useEffect(() => {
    const doSearch = async (searchQuery) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // setLoading(true); // 👈 REMOVIDO DAQUI
      setNothing(false);
      setSelectedIndex(0);
      updateBoxPosition();

      try {
        const resultData = await onSearch(searchQuery || '', controller.signal);
        
        if (!controller.signal.aborted) {
          setData(resultData);
          setNothing(resultData.length === 0);
          setLoading(false); // Desliga o loading no sucesso
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error);
          setLoading(false); // Desliga o loading no erro
        }
        // Se for AbortError, não faz nada, pois o loading
        // será controlado pela *próxima* busca.
      }
    };

    // 1. Se um valor foi selecionado, para o loading e não busca
    if (value) {
      setLoading(false)
      return;
    }

    // 2. Se foi um 'clear' ou 'blur', para o loading e não busca
    if (isClearingRef.current) {
      isClearingRef.current = false; 
      setLoading(false)
      return; 
    }
    
    // 3. Pula a busca (e para o loading) na montagem inicial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setLoading(false)
      return;
    }

    // 4. Se chegamos aqui, é uma digitação real. BUSCA.
    doSearch(debouncedQuery);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, value, onSearch, updateBoxPosition]); 


  /**
   * Efeito para fechar ao clicar fora
   */
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  /**
   * Efeito para rolar a sugestão selecionada para a vista
   */
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [selectedIndex]) 

  /**
   * Efeito para gerenciar a posição do Portal
   */
  useEffect(() => {
    if (isBoxOpen) {
      updateBoxPosition() 
      window.addEventListener('scroll', updateBoxPosition, true)
      window.addEventListener('resize', updateBoxPosition)
      
      return () => {
        window.removeEventListener('scroll', updateBoxPosition, true)
        window.removeEventListener('resize', updateBoxPosition)
      }
    } else {
      setBoxPosition(null) 
    }
  }, [isBoxOpen, updateBoxPosition]) 


  // --- Renderização ---

  const suggestionsContent = isBoxOpen && boxPosition && (
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
          {typeof children === 'function'
            ? children(item)
            : renderSuggestion(item)}
        </Suggestion>
      ))}
      {nothing && (
        <Nothing
          onMouseDown={(e) => {
            e.preventDefault()
            setData([])
            setNothing(false)
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
        {...rest} 
        autoComplete="off"
        size={props.size ?? 'small'}
        variant={props.variant ?? 'filled'}
        inputRef={inputRef}
        name={name}
        value={valueText}
        onChange={handleInputChange} 
        // 👇 *** MUDANÇA 3: onBlur agora também desliga o loading ***
        onBlur={(e) => {
          field?.onBlur(e) 
          if (!value && query) {
            isClearingRef.current = true; 
            setQuery(''); 
            setLoading(false); // Desliga o loading
          }
          setData([])
        }}
        onKeyDown={handleKeyDown}
        fullWidth
        error={showError}
        helperText={errorMessage}
        InputProps={{
          ...rest.InputProps, 
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
                  onMouseDown={handleClear} 
                  disabled={props.disabled}
                >
                  <i className="ri-close-line" style={{ fontSize: 20 }} />
                </IconButton>
              ) : ( 
                <IconButton
                  tabIndex={-1}
                  size="small"
                  edge="end"
                  onMouseDown={handleSearch} 
                  disabled={props.disabled}
                >
                  <i className="ri-search-line" style={{ fontSize: 20 }} />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />

      {suggestionsContent && ReactDOM.createPortal(suggestionsContent, document.body)}
    </AutocompleteContainer>
  )
}

export default AutoComplete