"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Op } from "sequelize"

export async function getReceivements({limit = 50, offset, dueDate}) {

    const session = await getServerSession(authOptions)

    await getTinyPayments({start: format(dueDate.start, "dd/MM/yyyy"), end: format(dueDate.end, "dd/MM/yyyy")})

    const db = new AppContext()

    const payments = await db.FinancialMovementInstallment.findAndCountAll({
        include: [
            { model: db.FinancialMovement, as: 'financialMovement', include: [
                { model: db.FinancialCategory, as: 'financialCategory' },
                { model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname'] }
            ]},
            { model: db.PaymentMethod, as: 'paymentMethod' }
        ],
        where: {
            ...(dueDate?.start && dueDate?.end && {
                dueDate: {
                    [Op.between]: [dueDate.start, dueDate.end]
                }
            }),
            '$financialMovement.financialCategory.codigo_tipo_operacao$': 1
        },
        order: [['dueDate', 'ASC']],
        limit,
        offset: offset * limit
    })

    return {
        request: {
            limit, offset, dueDate
        },
        response: {
            count: payments.count,
            rows: _.map(payments.rows, (item) => item.get({ plain: true }))
        }
    }

}