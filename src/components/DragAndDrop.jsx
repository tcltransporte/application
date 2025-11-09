'use client'

import React, { useState, useRef } from 'react'
import {
  Typography,
  Button,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import _ from 'lodash'

export const DragAndDrop = ({ files = [], title = 'Upload', multiple = false, accept, onChange }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const safeOnChange = (next) => {
    if (typeof onChange === 'function') onChange(next)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files || [])
    if (droppedFiles.length > 0) addFiles(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) addFiles(selected)
    // limpa o input para permitir re-seleção do mesmo arquivo
    e.target.value = ''
  }

  /**
   * newFilesParam = array de File vindos do input/drop
   * currentFiles = props.files (fonte da verdade)
   */
  const addFiles = (newFilesParam) => {
    const currentFiles = Array.isArray(files) ? files : []

    if (!multiple) {
      // se não permite múltiplos, apenas pega o primeiro novo arquivo (substitui)
      const first = newFilesParam[0]
      const result = first ? [first] : []
      safeOnChange(result)
      return
    }

    // Para múltiplos: concatena current + novos e deduplica por name+size
    const combined = [...currentFiles, ...newFilesParam]
    const unique = _.uniqBy(combined, (f) => `${f.name}-${f.size}`)
    safeOnChange(unique)
  }

  const removeFile = (index) => {
    const updated = (files || []).filter((_, i) => i !== index)
    safeOnChange(updated)
  }

  const clearAll = (e) => {
    e?.stopPropagation()
    safeOnChange([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'grey.400',
        borderRadius: 2,
        p: 4,
        mb: 2,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: 'primary.main' },
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      {(multiple || (files || []).length === 0) && (
        <>
          <Typography fontWeight="bold">{title}</Typography>
          <Typography sx={{ my: 2 }}>Arraste e solte o arquivo aqui, ou</Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            startIcon={<i className="ri-upload-2-line" />}
          >
            Selecione o arquivo
          </Button>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {(files || []).length > 0 && (
        <Box mt={3} textAlign="left">
          {multiple && (
            <Typography fontWeight="bold" pt={4} mb={1} sx={{ pl: '16px' }}>
              Arquivos
            </Typography>
          )}

          <List dense>
            {files.map((file, index) => (
              <ListItem
                key={`${file?.name}-${file?.size}-${index}`}
                sx={{ borderBottom: '1px solid #e0e0e0', pr: 6 }}
              >
                <ListItemText
                  primary={file?.name}
                  secondary={`${(file?.size / 1024).toFixed(2)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={(e) => { e.stopPropagation(); removeFile(index) }}>
                    <i className="ri-delete-bin-6-line" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {multiple && (
            <Box textAlign="right" mt={1}>
              <Button
                color="error"
                size="small"
                onClick={clearAll}
                startIcon={<i className="ri-delete-bin-line" />}
              >
                Limpar todos
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
