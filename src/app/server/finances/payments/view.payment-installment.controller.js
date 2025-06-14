"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getInstallment({installmentId}) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const payment = await db.FinancialMovementInstallment.findOne({
        include: [
            {model: db.FinancialMovement, as: 'financialMovement', include: [
                {model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname']}
            ]},
            {model: db.PaymentMethod, as: 'paymentMethod'}
        ],
        where: [
            {codigo_movimento_detalhe: installmentId}
        ],
        limit: 20
    })

    return payment?.get({ plain: true })

}

export async function saveInstallment(formData) {

    const db = new AppContext()

    const [installment] = await db.FinancialMovementInstallment.upsert(formData, {
        returning: true,
    })

    return installment?.get({ plain: true })

}