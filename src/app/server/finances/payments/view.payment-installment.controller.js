"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getInstallment({installmentId}) {
    
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const payment = await db.FinancialMovementInstallment.findOne({
        attributes: ['installment', 'amount', 'dueDate', 'observation'],
        include: [
            {model: db.FinancialMovement, as: 'financialMovement', attributes: ['documentNumber', 'issueDate'],
                include: [
                    {model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname']},
                    {model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'surname']},
                    {model: db.CenterCost, as: 'centerCost', attributes: ['id', 'description']},
                    {model: db.FinancialCategory, as: 'financialCategory', attributes: ['id', 'description']},
                ]
            },
            {model: db.PaymentMethod, as: 'paymentMethod', attributes: ['id', 'name']},
            {model: db.BankAccount, as: 'bankAccount', attributes: ['codigo_conta_bancaria', 'agency', 'number'], include: [
                {model: db.Bank, as: 'bank', attributes: ['id', 'name']}
            ]},
        ],
        where: [
            {codigo_movimento_detalhe: installmentId}
        ]
    })
    
    return payment.toJSON()

}

export async function createMovement(formData) {

    const db = new AppContext();

    await db.transaction(async (transaction) => {

        const movement = await db.FinancialMovement.create({
            ...formData,
            companyId: formData.company?.codigo_empresa_filial,
            centerCostId: formData.centerCost?.id,
            categoryId: formData.financialCategory?.id,
            partnerId: formData.receiver?.codigo_pessoa,
            observation: formData.observation
        }, {transaction})

        let installment = 1
        let observation = formData.observation
        for (const item of formData.installments) {

            if (_.size(formData.installments > 1)) {
                observation += ` - Parcela ${installment}`
            }

            await db.FinancialMovementInstallment.create({
                ...item,
                financialMovementId: movement.codigo_movimento,
                paymentMethodId: formData.paymentMethod.id,
                bankAccountId: formData.bankAccount?.codigo_conta_bancaria,
                observation
            }, {transaction})

            installment++

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
        { ...formData, centerCostId: formData.centerCost?.id },
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
