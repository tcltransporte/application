"use server"

import { AppContext } from "@/database"
import { format, fromZonedTime } from "date-fns-tz"

export async function onSubmitChanges(formData) {
    
    const db = new AppContext()

    await db.transaction(async (transaction) => {

        //console.log(formData.statement)

        const statement = await db.Statement.create({
            sourceId: formData.statement.sourceId,
            bankAccountId: formData.bankAccount.codigo_conta_bancaria,
            begin: format(fromZonedTime(formData.statement.begin, Intl.DateTimeFormat().resolvedOptions().timeZone),'yyyy-MM-dd HH:mm'),
            end: format(fromZonedTime(formData.statement.end, Intl.DateTimeFormat().resolvedOptions().timeZone),'yyyy-MM-dd HH:mm'),
            isActive: true
        }, {transaction})

        for (const item of formData.statement.statementData) {
            await db.StatementData.create({statementId: statement.id, ...item, extra: JSON.stringify(item.extra)}, {transaction})
        }

    })

}