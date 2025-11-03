import * as services from '@/app/server/register/services';
import { ViewSalesOrders } from '@/views/sales/orders';
import { Typography } from '@mui/material';

export const metadata = {
  title: `${process.env.TITLE} - Pedidos`,
}

export default async () => {
  try {

    const initialServices = await services.findAll({ limit: 50, offset: 0 })

    return <ViewSalesOrders initialServices={initialServices} />

  } catch (error) {
    
    return <Typography>{error.message}</Typography>

  }
}