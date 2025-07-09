import { getCtes } from '@/app/server/expedition/ctes/index.controller';
import { getShippiments } from '@/app/server/expedition/shippiments/index.controller';
import { DateFormat } from '@/utils/extensions';
import { ViewExpeditionCtes } from '@/views/expedition/ctes';
import { ViewExpeditionShippiments } from '@/views/expedition/shippiments';
import { Typography } from '@mui/material';
import { endOfMonth, format, startOfMonth } from 'date-fns';

export const metadata = {
  title: `${process.env.TITLE} - Conhecimentos`,
}

const ExpeditionCtes = async () => {
  try {

    const now = new Date()

    const start = DateFormat(startOfMonth(now), "yyyy-MM-dd HH:mm:ss")
    const end = DateFormat(endOfMonth(now), "yyyy-MM-dd HH:mm:ss")

    //const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
    //const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

    const initialPayments = await getCtes({
      limit: 50,
      offset: 0,
      dhEmi: { start, end },
    })

    console.log(initialPayments)

    return <ViewExpeditionCtes initialPayments={initialPayments} />

  } catch (error) {
    return <Typography>{error.message}</Typography>
    //return <Typography>{JSON.stringify(error)}</Typography>
  }
}

export default ExpeditionCtes