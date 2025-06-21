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
        ]
    })

    console.log(payment?.get({ plain: true }))

    return payment?.get({ plain: true })

}

export async function createMovement(formData) {

    const db = new AppContext();

    await db.transaction(async (transaction) => {

        const movement = await db.FinancialMovement.create({
            ...formData,
            partnerId: formData.receiver.codigo_pessoa,
        }, {transaction})

        for (const item of formData.installments) {

            await db.FinancialMovementInstallment.create({
                ...item,
                financialMovementId: movement.codigo_movimento,
                paymentMethodId: formData.paymentMethod.id,
            }, {transaction})

        }

    })

    return

  let installment;

  await db.transaction(async (transaction) => {

    if (formData.codigo_movimento_detalhe) {
        // Atualiza o registro existente
        await db.FinancialMovementInstallment.update(
        { ...formData },
        { where: { codigo_movimento_detalhe: formData.codigo_movimento_detalhe } }
        );

        // Busca o registro atualizado
        installment = await db.FinancialMovementInstallment.findByPk(formData.codigo_movimento_detalhe);
    } else {
        // Cria um novo registro
        installment = await db.FinancialMovementInstallment.create({ ...formData });
    }

  })

  return installment?.get({ plain: true });

}

export async function submitInstallment(formData) {

  const db = new AppContext();

  let installment;

  await db.transaction(async (transaction) => {

    if (formData.codigo_movimento_detalhe) {
        // Atualiza o registro existente
        await db.FinancialMovementInstallment.update(
        { ...formData },
        { where: { codigo_movimento_detalhe: formData.codigo_movimento_detalhe }, transaction }
        );

        // Busca o registro atualizado
        installment = await db.FinancialMovementInstallment.findByPk(formData.codigo_movimento_detalhe, {transaction});
    } else {
        // Cria um novo registro
        installment = await db.FinancialMovementInstallment.create({ ...formData }, {transaction});
    }

  })

  return installment?.get({ plain: true });
}
