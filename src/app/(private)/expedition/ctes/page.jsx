import * as ctes from '@/app/server/expedition/ctes';
import * as shippiments from '@/app/server/expedition/shippiments';
import { authOptions } from '@/libs/auth';
import { DateFormat } from '@/utils/extensions';
import { ViewExpeditionCtes } from '@/views/expedition/ctes';
import { ViewExpeditionShippiments } from '@/views/expedition/shippiments';
import { Typography } from '@mui/material';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { getServerSession } from 'next-auth';

export const metadata = {
  title: `${process.env.TITLE} - Conhecimentos`,
}

const ExpeditionCtes = async () => {
  try {

    const session = await getServerSession(authOptions);

    const now = new Date()

    const start = DateFormat(now, "yyyy-MM-dd 00:00:00")
    const end = DateFormat(now, "yyyy-MM-dd 23:59:59")

    //const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
    //const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

    const initialCtes = await ctes.findAll({
      company: session.company,
      dhEmi: { start, end },
      limit: 50,
      offset: 0,
    })

    return <ViewExpeditionCtes initialCtes={initialCtes} />

  } catch (error) {
    return <Typography>{error.message}</Typography>
    //return <Typography>{JSON.stringify(error)}</Typography>
  }
}

export default ExpeditionCtes