import { getReceivements } from '@/app/server/finances/receivements/index.controller';
import { DateFormat } from '@/utils/extensions';
import { ViewFinancesReceivements } from '@/views/finances/receivements';
import { endOfMonth, format, startOfMonth } from 'date-fns';

export const metadata = {
  title: `${process.env.TITLE} - Contas a pagar`,
}

export default async function FinancesReceivements() {

  const now = new Date()

  //const start = DateFormat(startOfMonth(now), "yyyy-MM-dd HH:mm:ss")
  //const end = DateFormat(endOfMonth(now), "yyyy-MM-dd HH:mm:ss")

  const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
  const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

  const initialPayments = await getReceivements({
    limit: 50,
    offset: 0,
    dueDate: { start, end },
  })

  return <ViewFinancesReceivements initialPayments={initialPayments} />

}