import { getPayments } from '@/app/server/finances/payments/index.controller';
import { DateFormat } from '@/utils/extensions';
import { ViewFinancesPayments } from '@/views/finances/payments';
import { endOfMonth, format, startOfMonth } from 'date-fns';

export const metadata = {
  title: `${process.env.TITLE} - Contas a pagar`,
}

export default async function FinancesPayments() {

  const now = new Date()

  //const start = DateFormat(startOfMonth(now), "yyyy-MM-dd HH:mm:ss")
  //const end = DateFormat(endOfMonth(now), "yyyy-MM-dd HH:mm:ss")

  const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
  const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

  const initialPayments = await getPayments({
    limit: 50,
    offset: 0,
    dueDate: { start, end },
  })

  return <ViewFinancesPayments initialPayments={initialPayments} />

}