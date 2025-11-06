import * as orders from '@/app/server/sales/orders';
import { ViewSalesOrders } from '@/views/sales/orders';
import { Typography } from '@mui/material';

export const metadata = {
  title: `${process.env.TITLE} - Pedidos`,
}

export default async () => {
  try {

    const initialOrders = await orders.findAll({ limit: 50, offset: 0 })

    return <ViewSalesOrders initialOrders={initialOrders} />

  } catch (error) {
    
    return <Typography>{error.message}</Typography>

  }
}