import { getPayments } from '@/app/server/finances/payments/index.controller';

import { ViewFinancesPayments } from '@/views/finances/payments'

const FinancesPayments = async () => {

  const initialPayments = await getPayments();
  
  return <ViewFinancesPayments initialPayments={initialPayments} />

}

export default FinancesPayments
