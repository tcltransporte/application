import * as partners from '@/app/server/register/partner';
import { ViewRegisterPartners } from '@/views/register/partners';
import { Typography } from '@mui/material';

export const metadata = {
  title: `${process.env.TITLE} - Clientes`,
}

export default async () => {
  try {

    const initialPartners = await partners.findAll({ limit: 50, offset: 0 })

    return <ViewRegisterPartners initialPartners={initialPartners} />

  } catch (error) {
    console.error(error.message)
    return <Typography>{error.message}</Typography>

  }
}