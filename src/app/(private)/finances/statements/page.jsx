import * as statements from '@/app/server/finances/statements'
import { DateFormat } from '@/utils/extensions'
import { ViewFinancesStatements } from '@/views/finances/statements'
import { endOfWeek, startOfWeek } from 'date-fns'
//import { getStatements } from '@/views/finances/statements/index.controller'

export const metadata = {
  title: `${process.env.TITLE} - Extratos`,
}

export default async function FinancesStatements() {

  const now = new Date()

  // pega início da semana (segunda-feira)
  const start = DateFormat(
    startOfWeek(now, { weekStartsOn: 1 }), // 1 = segunda
    "yyyy-MM-dd 00:00:00"
  )

  // pega final da semana (domingo)
  const end = DateFormat(
    endOfWeek(now, { weekStartsOn: 1 }),
    "yyyy-MM-dd 23:59:59"
  )
  
  const initialStatements = await statements.findAll({
    limit: 50,
    offset: 0,
    date: {
      begin: start,
      end: end
    }
  })

  return <ViewFinancesStatements initialStatements={initialStatements} />

}