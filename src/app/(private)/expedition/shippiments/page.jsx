import { getShippiments } from '@/app/server/expedition/shippiments/index.controller';
import { DateFormat } from '@/utils/extensions';
import { ViewExpeditionShippiments } from '@/views/expedition/shippiments';
import { Typography } from '@mui/material';
import { endOfMonth, format, startOfMonth } from 'date-fns';

export const metadata = {
  title: `${process.env.TITLE} - Romaneios`,
}

const ExpeditionShippiments = async () => {
  try {

    const now = new Date()

    //const start = DateFormat(startOfMonth(now), "yyyy-MM-dd HH:mm:ss")
    //const end = DateFormat(endOfMonth(now), "yyyy-MM-dd HH:mm:ss")

    const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
    const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

    const initialPayments = await getShippiments({
      limit: 50,
      offset: 0,
      dueDate: { start, end },
    })

    return <ViewExpeditionShippiments initialPayments={initialPayments} />

  } catch (error) {
    return <Typography>{error.message}</Typography>
    //return <Typography>{JSON.stringify(error)}</Typography>
  }
}

export default ExpeditionShippiments