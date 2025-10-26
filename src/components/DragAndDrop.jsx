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

export const DragAndDrop = ({ title, multiple = true, accept, onFiles }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileInputRef = useRef(null)

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
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) addFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) addFiles(files)
    // 🔥 limpa o valor para permitir re-selecionar o mesmo arquivo
    e.target.value = ''
  }

  const addFiles = (files) => {
    const uniqueFiles = files.filter(
      (f) => !selectedFiles.some((sf) => sf.name === f.name && sf.size === f.size)
    )
    const newFiles = multiple ? [...selectedFiles, ...uniqueFiles] : uniqueFiles
    setSelectedFiles(newFiles)
    onFiles?.(newFiles)
  }

  const removeFile = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(updated)
    onFiles?.(updated)
  }

  const clearAll = () => {
    setSelectedFiles([])
    onFiles?.([])
    // também limpa o input
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
    >
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

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {selectedFiles.length > 0 && (
        <Box mt={3} textAlign="left">
          <Typography fontWeight="bold" pt={4} mb={1} sx={{ pl: '16px' }}>
            Arquivos
          </Typography>

          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={file.name + file.size}
                sx={{ borderBottom: '1px solid #e0e0e0', pr: 6 }}
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removeFile(index)}>
                    <i className="ri-delete-bin-6-line" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

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
        </Box>
      )}
    </Box>
  )
}
