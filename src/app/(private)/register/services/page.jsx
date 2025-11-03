import * as services from '@/app/server/register/services';
import { ViewRegisterService } from '@/views/register/services';
import { Typography } from '@mui/material';

export const metadata = {
  title: `${process.env.TITLE} - Serviços`,
}

export default async () => {
  try {

    const initialServices = await services.findAll({ limit: 50, offset: 0 })

    return <ViewRegisterService initialServices={initialServices} />

  } catch (error) {

    return <Typography>{error.message}</Typography>

  }
}