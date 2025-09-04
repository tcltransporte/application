'use server'

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getTinyPayments } from "@/utils/integrations/tiny"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"
import Sequelize from "sequelize"

export async function findAll({ limit = 50, offset, company, documentNumber, receiver, category, dueDate, observation, status }) {

  const session = await getServerSession(authOptions)

  await getTinyPayments({start: format(dueDate.start, "dd/MM/yyyy"), end: format(dueDate.end, "dd/MM/yyyy")})
    
  const db = new AppContext()

  const whereClauses = []

  // Filtro por empresa/filial (dentro do financialMovement)
  if (company?.codigo_empresa_filial) {
    whereClauses.push({
      '$financialMovement.CodigoEmpresaFilial$': company.codigo_empresa_filial
    })
  }

  if (!_.isEmpty(documentNumber)) {
    whereClauses.push({
      '$financialMovement.numero_documento$': {
        [Sequelize.Op.like]: `%${documentNumber.replace(/ /g, "%").toUpperCase()}%`
      }
    })
  }

  if (receiver?.codigo_pessoa) {
    whereClauses.push({
      '$financialMovement.codigo_pessoa$': receiver.codigo_pessoa
    })
  }

  if (category?.id) {
    whereClauses.push({
      '$financialMovement.IDPlanoContasContabil$': category.id
    })
  }

  // Filtro por data de vencimento
  if (dueDate?.start && dueDate?.end) {
    whereClauses.push({
      dueDate: {
        [Sequelize.Op.between]: [dueDate.start, dueDate.end]
      }
    })
  }

  
  if (!_.isEmpty(observation)) {
    whereClauses.push({
      '$FinancialMovementInstallment.Descricao$': {
        [Sequelize.Op.like]: `%${observation.replace(/ /g, "%").toUpperCase()}%`
      }
    })
  }

  // Filtro por status
  if (status && status.length === 1) {
    if (status[0] === 0) {
      // Em aberto
      whereClauses.push({
        codigo_pagamento: null
      })
    } else if (status[0] === 1) {
      // Quitado
      whereClauses.push({
        codigo_pagamento: {
          [Sequelize.Op.ne]: null
        }
      })
    }
  }

  // Tipo de operação fixo
  whereClauses.push({
    '$financialMovement.financialCategory.codigo_tipo_operacao$': 2
  })

  const payments = await db.FinancialMovementInstallment.findAndCountAll({
    attributes: ['codigo_movimento_detalhe', 'installment', 'amount', 'dueDate', 'observation'],
    include: [
      { model: db.FinancialMovement, as: 'financialMovement', include: [
          { model: db.Company, as: 'company', attributes: ['codigo_empresa_filial', 'surname'] },
          { model: db.FinancialCategory, as: 'financialCategory', attributes: ['description'] },
          { model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname'] }
        ]
      },
      { model: db.PaymentMethod, as: 'paymentMethod' },
      { model: db.BankAccount, as: 'bankAccount', attributes: ['codigo_conta_bancaria', 'agency', 'number'], include: [
        { model: db.Bank, as: 'bank', attributes: ['id', 'name'] }
      ]},
    ],
    where: {
      [Sequelize.Op.and]: whereClauses
    },
    order: [['dueDate', 'ASC']],
    limit,
    offset: offset * limit
  })

  return {
    request: {
      limit, offset, company, dueDate, status
    },
    response: {
      count: payments.count,
      rows: payments.rows.map(item => item.get({ plain: true }))
    }
  }
  
}

export async function findOne({ installmentId }) {

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

export async function insert(formData) {

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

}

export async function update(formData) {
  

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

export async function concile(id = []) {
 
  const url = `https://api.tiny.com.br/api2/conta.pagar.baixar.php?token=${
    company.dataValues.tiny.token
  }&conta=${encodeURIComponent(
    JSON.stringify({
      conta: {
        id: item.dataValues.payment.sourceId,
        data: dayjs(item.statementData?.date).format("DD/MM/YYYY"),
        contaOrigem: "Mercado Pago",
        valorPago: parseFloat(item?.amount) * -1,
        historico: historico
      }
    })
  )}&formato=JSON`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })

  const baixado = await response.json()

}

export async function destroy({ codigo_conta_bancaria }) {
  const session = await getServerSession(authOptions)
  const db = new AppContext()
  return db.BankAccount.destroy({ where: { codigo_conta_bancaria } })
}