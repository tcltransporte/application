import * as fiscal from '@/app/server/fiscal/entries';
import { Typography } from '@mui/material';
import { ViewFiscalEntries } from '@/views/fiscal/entries';

export const metadata = {
  title: `${process.env.TITLE} - Pedidos`,
}

export default async () => {
  try {

    const initialEntries = await fiscal.findAll({ limit: 50, offset: 0 })

    return <ViewFiscalEntries initialEntries={initialEntries} />

  } catch (error) {
    
    return <Typography>{error.message}</Typography>

  }
}