"use server"

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import KanbanBoard from '@views/apps/kanban'

// Util Imports
import { commonLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
//import styles from '@views/apps/kanban/styles.module.css'
import { getBankAccounts } from '@/views/apps/kanban/index.controller'

const KanbanPage = async () => {
  
  const bankAccounts = await getBankAccounts()

  return (
    <div
      className={classnames(
        commonLayoutClasses.contentHeightFixed,
        styles.scroll,
        'is-full overflow-auto pis-2 -mis-2'
      )}
    >
      <KanbanBoard initialBankAccounts={bankAccounts.columns} initialInstallments={bankAccounts.tasks} />
    </div>
  )
}

export default KanbanPage
