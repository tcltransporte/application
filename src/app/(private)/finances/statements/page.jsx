import * as statements from '@/app/server/finances/statements'
import { ViewFinancesStatements } from '@/views/finances/statements'
//import { getStatements } from '@/views/finances/statements/index.controller'

export const metadata = {
  title: `${process.env.TITLE} - Extratos`,
}

export default async function FinancesStatements() {

  const initialStatements = await statements.findAll({
    limit: 50,
    offset: 0
  })

  return <ViewFinancesStatements initialStatements={initialStatements} />

}