"use client"

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'

// Component Imports
//import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
//import UpgradePlan from '@components/dialogs/upgrade-plan'
//import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const CurrentPlan = ({ data }) => {
  const buttonProps = (children, color, variant) => ({
    children,
    variant,
    color
  })

  return (
    <Card>
      <CardHeader title='Assinatura atual' className='pbe-6' />
      <CardContent>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
            <div className='flex flex-col gap-1'>
              <Typography className='font-medium' color='text.primary'>
                Sua assinatura atual é básico
              </Typography>
              <Typography>Um começo simples para todos</Typography>
            </div>
            <div className='flex flex-col gap-1'>
              <Typography className='font-medium' color='text.primary'>
                Expira em 09 de dezembro de 2021
              </Typography>
              <Typography>Enviaremos uma notificação quando a assinatura expirar</Typography>
            </div>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Typography className='font-medium' color='text.primary'>
                  R$ 199,00 por mês
                </Typography>
                <Chip variant='tonal' color='primary' label='Popular' size='small' />
              </div>
              <Typography>Plano padrão para pequenas e médias empresas</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} className='flex flex-col gap-6'>
            <Alert severity='warning'>
              <AlertTitle>Precisamos da sua atenção!</AlertTitle>
              Seu plano requer atualização
            </Alert>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center justify-between'>
                <Typography className='font-medium' color='text.primary'>
                  Dias
                </Typography>
                <Typography className='font-medium' color='text.primary'>
                  12 de 30 Dias
                </Typography>
              </div>
              <LinearProgress variant='determinate' value={40} />
              <Typography variant='body2'>Faltam 18 dias para que seu plano precise ser atualizado</Typography>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }} className='flex gap-4 flex-wrap'>
            {/*<OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Upgrade', 'primary', 'contained')}
              dialog={UpgradePlan}
              dialogProps={{ data: data }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Cancelar assinatura', 'error', 'outlined')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'unsubscribe' }}
            />*/}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CurrentPlan
