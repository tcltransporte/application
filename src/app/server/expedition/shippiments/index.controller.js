"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getTinyPayments } from "@/utils/integrations/tiny"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Op } from "sequelize"

export async function getShippiments({limit = 50, offset, dueDate}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    /*
  
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
    }*/

    const where = []

    /*
    if (search?.input) {

        if (search?.picker == 'code') {
        where.push({codigo_carga: search.input.match(/\d+/g)})
        }

        if (search?.picker == 'documentTransport') {
        where.push({documento_transporte: {[Sequelize.Op.like]: `%${search.input.replace(' ', "%")}%`}})
        }

    }*/

    let result

    await db.transaction(async (transaction) => {

        const shippiments = await db.Shippiment.findAndCountAll({
            attributes: ['codigo_carga', 'documentNumber'],
            include: [
                {model: db.Partner, as: 'sender', attributes: ['codigo_pessoa', 'surname']},
                {model: db.Cte, as: 'ctes', attributes: ['id', 'chCTe']},
            ],
            limit: limit,
            offset: offset * limit,
            order: [['codigo_carga', 'desc']],
            where,
            transaction
        })

        result = {
            request: {
                limit, offset
            },
            response: {
                rows: _.map(shippiments.rows, (item) => item.toJSON()), count: shippiments.count
            }
        }

    })

    return result

}