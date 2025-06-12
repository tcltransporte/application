"use server"

import { ViewFinancesStatements } from '@/views/finances/statements'
import { getStatements } from '@/views/finances/statements/index.controller'

const FinancesStatements = async () => {

  const initialStatements = await getStatements()

  return <ViewFinancesStatements initialStatements={initialStatements} />

}

export default FinancesStatements
