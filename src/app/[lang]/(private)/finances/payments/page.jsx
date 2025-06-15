import { getPayments } from '@/app/server/finances/payments/index.controller';
import { DateFormat } from '@/utils/extensions';
import { ViewFinancesPayments } from '@/views/finances/payments';
import { endOfMonth, format, startOfMonth } from 'date-fns';

const FinancesPayments = async () => {

  const now = new Date()

  const start = DateFormat(startOfMonth(now), "yyyy-MM-dd HH:mm:ss")
  const end = DateFormat(endOfMonth(now), "yyyy-MM-dd HH:mm:ss")

  const initialPayments = await getPayments({
    limit: 50,
    offset: 0,
    dueDate: { start, end },
  })

  return <ViewFinancesPayments initialPayments={initialPayments} />
}

export default FinancesPayments