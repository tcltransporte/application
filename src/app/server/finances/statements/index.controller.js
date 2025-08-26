"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getStatements({limit, offset}) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const statements = await db.Statement.findAndCountAll({
        include: [
            {model: db.BankAccount, as: 'bankAccount', include: [
                {model: db.Bank, as: 'bank'}
            ]}
        ],
        where: [
            {'$bankAccount.CodigoEmpresaFilial$': session.company.codigo_empresa_filial}
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    })

    //return _.map(statements, (item) => item.get({ plain: true }))

    return {
        request: {
            limit, offset
        },
        response: {
            count: statements.count,
            rows: _.map(statements.rows, (item) => item.get({ plain: true }))
        }
    }

}