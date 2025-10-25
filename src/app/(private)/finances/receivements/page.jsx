import * as receivements from '@/app/server/finances/receivements';
import { authOptions } from '@/libs/auth';
import { DateFormat } from '@/utils/extensions';
import { ViewFinancesReceivements } from '@/views/finances/receivements';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { getServerSession } from 'next-auth';

export const metadata = {
  title: `${process.env.TITLE} - Contas a receber`,
}

export default async function FinancesReceivements() {

  const session = await getServerSession(authOptions);

  const start = DateFormat(new Date(), "yyyy-MM-dd 00:00:00")
  const end = DateFormat(new Date(), "yyyy-MM-dd 23:59:59")

  const initialReceivements = await receivements.findAll({
    limit: 50,
    offset: 0,
    company: session.company,
    status: [0],
    dueDate: { start, end },
  })

  return <ViewFinancesReceivements initialReceivements={initialReceivements} />

}