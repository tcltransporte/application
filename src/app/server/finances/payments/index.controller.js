"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getTinyPayments } from "@/utils/integrations/tiny"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Op } from "sequelize"

export async function getPayments({ limit = 50, offset, company, documentNumber, receiver, category, dueDate, observation, status }) {

  const session = await getServerSession(authOptions)

  await getTinyPayments({start: format(dueDate.start, "dd/MM/yyyy"), end: format(dueDate.end, "dd/MM/yyyy")})
    
  console.log(dueDate)
  
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
        [Op.like]: `%${documentNumber.replace(/ /g, "%").toUpperCase()}%`
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
        [Op.between]: [dueDate.start, dueDate.end]
      }
    })
  }

  
  if (!_.isEmpty(observation)) {
    whereClauses.push({
      '$FinancialMovementInstallment.Descricao$': {
        [Op.like]: `%${observation.replace(/ /g, "%").toUpperCase()}%`
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
          [Op.ne]: null
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
      [Op.and]: whereClauses
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