"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Op } from "sequelize"

export async function getPayments({limit, offset, dueDate}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const payments = await db.FinancialMovementInstallment.findAndCountAll({
        include: [
            { model: db.FinancialMovement, as: 'financialMovement', include: [
                { model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname'] }
            ]},
            { model: db.PaymentMethod, as: 'paymentMethod' }
        ],
        where: {
            ...(dueDate?.start && dueDate?.end && {
                dueDate: {
                    [Op.between]: [dueDate.start, dueDate.end]
                }
            })
        },
        limit,
        offset
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