import { getStatements } from '@/app/server/finances/statements/index.controller'
import { ViewFinancesStatements } from '@/views/finances/statements'
//import { getStatements } from '@/views/finances/statements/index.controller'

export const metadata = {
  title: `${process.env.TITLE} - Extratos`,
}

export default async function FinancesStatements() {

  const initialStatements = await getStatements({
    limit: 50,
    offset: 0
  })

  return <ViewFinancesStatements initialStatements={initialStatements} />

}