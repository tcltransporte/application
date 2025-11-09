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
import { CardContent, Paper } from '@mui/material'

// Plugin renderer
import { PluginRenderer } from './plugins'

// Controller
import {
  getMyIntegrations,
  onDisconnect,
  onToggleActive
} from '@/app/server/settings/integrations/index.controller'
import { useTitle } from '@/contexts/TitleProvider'
import { styles } from '@/components/styles'

const Integrations = ({ integrations }) => {
  const [connectedIntegrations, setConnectedIntegrations] = useState([])
  const [connectDrawerOpen, setConnectDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
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
    setAddDrawerOpen(false)
    setSelectedIntegration(integration)
    setConnectDrawerOpen(true)
  }

  const handleSave = () => {
    setConnectDrawerOpen(false)
    setEditDrawerOpen(false)
    setSelectedIntegration(null)
    fetchMyIntegrations()
  }

  const handleCloseDrawers = () => {
    setConnectDrawerOpen(false)
    setEditDrawerOpen(false)
    setAddDrawerOpen(false)
    setSelectedIntegration(null)
  }

  return (
    <Card>
      <CardContent className='mbe-5'>

        <Box>
          <Box>
            <Button
              className='max-sm:is-full'
              variant='contained'
              startIcon={<i className='ri-add-circle-line' />}
              onClick={() => setAddDrawerOpen(true)}
            >
              Adicionar
            </Button>
          </Box>

          <Box sx={styles.tableWrapper}>
            <Paper sx={styles.paperContainer}>
                  
            {loading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Grid container spacing={4} mb={6}>
                {connectedIntegrations.length > 0 ? (
                  connectedIntegrations.map((integration, index) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={index}
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
                  <Grid item xs={12} sx={{paddingTop: '16px'}}>
                    <Typography>
                      Nenhuma integração conectada ainda.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}

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
                        ? selectedIntegration.integration.id // conectada
                        : selectedIntegration.id // disponível
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

            {/* Drawer de Adição */}
            <Drawer
              anchor="right"
              open={addDrawerOpen}
              onClose={handleCloseDrawers}
              PaperProps={{ sx: { width: 1100, p: 4 } }}
            >
              <Typography variant="h5" mb={2}>
                Integrações disponíveis
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                {integrations.length > 0 ? (
                  integrations.map((integration) => (
                    <Grid item size={{sx: 12, sm: 4}} key={`available-${integration.name}`}>
                      <Card variant="outlined" sx={{ height: 150, display: 'flex' }}>
                        <Box
                          component="img"
                          src={integration.icon}
                          alt={integration.name}
                          sx={{
                            width: 120,
                            height: '100%',
                            objectFit: 'contain',
                            flexShrink: 0,
                            borderRadius: '4px 0 0 4px',
                          }}
                        />
                        <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {integration.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ flexGrow: 1 }}
                          >
                            {integration.description}
                          </Typography>
                          <Box display="flex" justifyContent="flex-end">
                            <Button
                              variant="outlined"
                              color="success"
                              size="small"
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
            </Drawer>

            </Paper>
          </Box>
        </Box>

      </CardContent>
      
    </Card>
  )
}

export default Integrations
