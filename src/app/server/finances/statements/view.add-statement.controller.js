"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format, fromZonedTime } from "date-fns-tz"
import { getServerSession } from "next-auth"

export async function onSubmitChanges(formData) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    await db.transaction(async (transaction) => {

        const statement = await db.Statement.create({
            companyId: session.company.codigo_empresa_filial,
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