"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getStatements(formData) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const statements = await db.Statement.findAll({
        include: [
            {model: db.BankAccount, as: 'bankAccount', include: [
                {model: db.Bank, as: 'bank'}
            ]}
        ],
        where: [
            {'$bankAccount.CodigoEmpresaFilial$': session.company.codigo_empresa_filial}
        ]
    })

    return _.map(statements, (item) => item.get({ plain: true }))

}