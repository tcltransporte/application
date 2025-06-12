"use server"

import { ViewFinancesPayments } from '@/views/finances/payments'
import { getPayments } from '@/views/finances/payments/index.controller'

const FinancesPayments = async () => {

  const initialPayments = await getPayments();
  
  return <ViewFinancesPayments initialPayments={initialPayments} />

}

export default FinancesPayments
