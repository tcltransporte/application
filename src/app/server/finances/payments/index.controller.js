"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getTinyPayments } from "@/utils/integrations/tiny"
import { format } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Op } from "sequelize"

export async function getPayments({ limit = 50, offset, company, dueDate, status }) {
    
  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const whereClauses = []

  // Filtro por empresa/filial (dentro do financialMovement)
  if (company?.codigo_empresa_filial) {
    whereClauses.push({
      '$financialMovement.CodigoEmpresaFilial$': company.codigo_empresa_filial
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
    include: [
      {
        model: db.FinancialMovement,
        as: 'financialMovement',
        include: [
          { model: db.FinancialCategory, as: 'financialCategory' },
          {
            model: db.Partner,
            as: 'partner',
            attributes: ['codigo_pessoa', 'surname']
          }
        ]
      },
      { model: db.PaymentMethod, as: 'paymentMethod' }
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