import * as payments from '@/app/server/finances/payments';
import { authOptions } from '@/libs/auth';
import { DateFormat } from '@/utils/extensions';
import { ViewFinancesPayments } from '@/views/finances/payments';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { getServerSession } from 'next-auth';

export const metadata = {
  title: `${process.env.TITLE} - Contas a pagar`,
}

export default async function FinancesPayments() {

  const session = await getServerSession(authOptions);

  const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
  const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

  const initialPayments = await payments.findAll({
    limit: 50,
    offset: 0,
    company: session.company,
    status: [0],
    dueDate: { start, end },
  })

  return <ViewFinancesPayments initialPayments={initialPayments} />

}