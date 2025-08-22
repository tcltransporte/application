'use client'

import { useEffect, useState } from 'react'

// MUI
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'

// Plugin renderer
import { PluginRenderer } from './plugins'

// Controller
import {
  getMyIntegrations,
  onDisconnect,
  onToggleActive
} from '@/app/server/settings/integrations/index.controller'
import { Paper } from '@mui/material'
import { useTitle } from '@/contexts/TitleProvider'
import { useSearchParams } from 'next/navigation'
import { setCompanyIntegration } from '@/app/server/settings/index.controller'

const Integrations = ({ integrations }) => {
  const [connectedIntegrations, setConnectedIntegrations] = useState([])
  const [connectDrawerOpen, setConnectDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hoveredIntegration, setHoveredIntegration] = useState(null)
  const [disconnectingId, setDisconnectingId] = useState(null)

  const fetchMyIntegrations = async () => {
    setLoading(true)
    try {
      const updatedMyIntegrations = await getMyIntegrations()
      setConnectedIntegrations(updatedMyIntegrations)
    } catch (error) {
      console.error('Erro ao buscar integrações:', error)
      setConnectedIntegrations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyIntegrations()
  }, [])

  const disconnectIntegration = async ({ id }) => {
    setDisconnectingId(id)
    try {
      await onDisconnect({ id })
      setConnectedIntegrations((prev) => prev.filter((int) => int.id !== id))
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    } finally {
      setDisconnectingId(null)
    }
  }

  const handleToggleActive = async ({ id }) => {
    const integration = connectedIntegrations.find((int) => int.id === id)
    if (!integration) return

    const newIsActive = !integration.isActive

    try {
      await onToggleActive({ id, isActive: newIsActive })
      setConnectedIntegrations((prev) =>
        prev.map((int) =>
          int.id === id ? { ...int, isActive: newIsActive } : int
        )
      )
    } catch (error) {
      console.error('Erro ao alternar ativo:', error)
    }
  }

  const handleConfigureClick = (integration) => {
    setSelectedIntegration(integration)
    setEditDrawerOpen(true)
  }

  const handleConnectClick = (integration) => {
    setSelectedIntegration(integration)
    setConnectDrawerOpen(true)
  }

  const handleSave = () => {
    // Lógica de salvar configurações ou conexões
    setConnectDrawerOpen(false)
    setEditDrawerOpen(false)
    setSelectedIntegration(null)
    fetchMyIntegrations()
  }

  const handleCloseDrawers = () => {
    setConnectDrawerOpen(false)
    setEditDrawerOpen(false)
    setSelectedIntegration(null)
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Minhas integrações
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4} mb={6}>
          {connectedIntegrations.length > 0 ? (
            connectedIntegrations.map((integration) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={`connected-${integration.integration.name}`}
              >
                <Card
                  variant="outlined"
                  sx={{ height: 150, display: 'flex' }}
                  onMouseEnter={() => setHoveredIntegration(integration.id)}
                  onMouseLeave={() => setHoveredIntegration(null)}
                >
                  <Box
                    component="img"
                    src={integration.integration.icon}
                    alt={integration.integration.name}
                    sx={{
                      width: 150,
                      height: '100%',
                      objectFit: 'contain',
                      flexShrink: 0,
                      borderRadius: '4px 0 0 4px',
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      p: 2,
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="h6">
                        {integration.integration.name}
                      </Typography>
                      <IconButton
                        color="primary"
                        title="Configurar integração"
                        onClick={() => handleConfigureClick(integration)}
                      >
                        <i className="ri-settings-3-line" />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flexGrow: 1 }}
                    >
                      {integration.integration.description}
                    </Typography>
                    <Box
                      mt={2}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Switch
                        checked={integration.isActive}
                        onChange={() => handleToggleActive({ id: integration.id })}
                      />

                      {integration.isActive ? (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => disconnectIntegration({ id: integration.id })}
                          disabled={disconnectingId === integration.id}
                        >
                          {disconnectingId === integration.id
                            ? 'Desconectando...'
                            : 'Desconectar'}
                        </Button>
                      ) : hoveredIntegration === integration.id ? (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => disconnectIntegration({ id: integration.id })}
                          disabled={disconnectingId === integration.id}
                        >
                          {disconnectingId === integration.id
                            ? 'Desconectando...'
                            : 'Desconectar'}
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                          Inativada
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body2">
                Nenhuma integração conectada ainda.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      <Typography variant="h6" mb={2}>
        Integrações disponíveis
      </Typography>
      <Grid container spacing={4}>
        {integrations.length > 0 ? (
          integrations.map((integration) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={`available-${integration.name}`}
            >
              <Card variant="outlined" sx={{ height: 150, display: 'flex' }}>
                <Box
                  component="img"
                  src={integration.icon}
                  alt={integration.name}
                  sx={{
                    width: 150,
                    height: '100%',
                    objectFit: 'contain',
                    flexShrink: 0,
                    borderRadius: '4px 0 0 4px',
                    backgroundColor: '#f5f5f5',
                  }}
                />
                <Box
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}
                >
                  <Typography variant="h6" mb={1}>
                    {integration.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexGrow: 1 }}
                  >
                    {integration.description}
                  </Typography>
                  <Box
                    mt={2}
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="center"
                  >
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={() => handleConnectClick(integration)}
                    >
                      Conectar
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="body2">
              Nenhuma integração disponível para conectar.
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* Drawer de Edição */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={handleCloseDrawers}
        PaperProps={{ sx: { width: 350, p: 3 } }}
      >
        {selectedIntegration && (
          <>
            <Typography variant="h5" mb={2}>
              Configurar {selectedIntegration.integration?.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <PluginRenderer
              pluginId={
                selectedIntegration.integration
                  ? selectedIntegration.integration.id // para integração conectada
                  : selectedIntegration.id // para integração disponível
              }
              componentName={editDrawerOpen ? 'Settings' : 'Connect'}
              data={editDrawerOpen ? selectedIntegration.options : {}}
            />

          </>
        )}
      </Drawer>

      {/* Drawer de Conexão */}
      <Drawer
        anchor="right"
        open={connectDrawerOpen}
        onClose={handleCloseDrawers}
        PaperProps={{ sx: { width: 350, p: 3 } }}
      >
        {selectedIntegration && (
          <>
            <Typography variant="h5" mb={2}>
              Conectar {selectedIntegration.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <PluginRenderer
              pluginId={selectedIntegration.id}
              componentName="Connect"
              data={{}}
            />

          </>
        )}
      </Drawer>
    </Box>
  )
}


export const Successfully = () => {

  const {setTitle} = useTitle()
  
  useEffect(() => {
    setTitle(['Configurações', 'Integração'])
  }, [])

  return (
    <Paper
      elevation={1}
      sx={{
        maxWidth: 360,
        mx: 'auto',
        p: 4,
        textAlign: 'center',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      <Box
        component="div"
        sx={{
          mb: 3,
          display: 'inline-flex',
          borderRadius: '50%',
          border: theme => `2px solid ${theme.palette.success.main}`,
          width: 72,
          height: 72,
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          color: 'success.main',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="26"
            cy="26"
            r="25"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="157"
            strokeDashoffset="157"
            style={{
              animation: 'dash 1s ease forwards',
              animationDelay: '0.2s',
            }}
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            strokeDashoffset="48"
            d="M14 27l7 7 17-17"
            style={{
              animation: 'dash 0.8s ease forwards',
              animationDelay: '1.2s',
            }}
          />
          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
        </svg>
      </Box>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        Integração bem-sucedida
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sua integração foi concluída com sucesso.
      </Typography>

      {/*
      <Button
        variant="outlined"
        color="success"
        sx={{ textTransform: 'none' }}
      >
        Minhas integrações
      </Button>
      */}
    </Paper>
  )
}

export default Integrations
