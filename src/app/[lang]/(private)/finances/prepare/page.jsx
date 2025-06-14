import classnames from 'classnames'

// Component Imports
//import KanbanBoard from '@views/apps/kanban'

// Util Imports
import { commonLayoutClasses } from '@layouts/utils/layoutClasses'
import { getBankAccounts } from '@/app/server/finances/prepare/index.controller'
import KanbanBoard from '@/views/finances/prepare'

const KanbanPage = async () => {
  
  const bankAccounts = await getBankAccounts()

  return (
    <div
      className={classnames(
        commonLayoutClasses.contentHeightFixed,
        //styles.scroll,
        'is-full overflow-auto pis-2 -mis-2'
      )}
    >
      <KanbanBoard initialBankAccounts={bankAccounts.columns} initialInstallments={bankAccounts.tasks} />
    </div>
  )
}

export default KanbanPage
