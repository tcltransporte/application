"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { addDays, format } from "date-fns"
import { fromZonedTime } from "date-fns-tz"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"
import { orders } from "../settings/integrations/plugins/index.controller"
import { getTinyPayments, getTinyReceivements } from "@/utils/integrations/tiny"
import * as payments from "@/app/server/finances/payments"

export async function findAll({limit, offset, date}) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const whereClauses = []

  whereClauses.push({'$bankAccount.CodigoEmpresaFilial$': session.company.codigo_empresa_filial})

  // Filtro por data de vencimento
  if (date?.begin && date?.end) {
    whereClauses.push({
      [Sequelize.Op.or]: [
        {
          begin: {
            [Sequelize.Op.between]: [date.begin, date.end]
          }
        },
        {
          end: {
            [Sequelize.Op.between]: [date.begin, date.end]
          }
        }
      ]
    })
  }

  const statements = await db.Statement.findAndCountAll({
      include: [
          {model: db.BankAccount, as: 'bankAccount', include: [
              {model: db.Bank, as: 'bank'}
          ]}
      ],
      where: whereClauses,
      order: [['createdAt', 'DESC']],
      limit,
      offset
  })

  //return _.map(statements, (item) => item.get({ plain: true }))

  return {
      request: {
          limit, offset, date
      },
      response: {
          count: statements.count,
          rows: _.map(statements.rows, (item) => item.get({ plain: true }))
      }
  }

}

export async function findOne({ statementId }) {

  const db = new AppContext()

  const statement = await db.Statement.findOne({
    where: { id: statementId }
  })

  if (!statement) return null

  const entryTypes = statement.entryTypes ?? []
  const entryTypesArray = typeof entryTypes === 'string'
    ? entryTypes.split(',')
    : entryTypes

  const statementData = await db.StatementData.findAll({
    where: [{
      statementId: statement.id,
      sourceId: { [Sequelize.Op.ne]: '' }
      //entryType: { [Sequelize.Op.in]: entryTypesArray }
    }],
    order: [
      [Sequelize.literal('CASE WHEN [entryDate] IS NULL THEN 1 ELSE 0 END'), 'ASC'],
      ['entryDate', 'ASC'],
      [{ model: db.StatementDataConciled, as: 'concileds' }, 'type', 'ASC']
    ],
    include: [
      { model: db.StatementDataConciled, as: 'concileds', attributes: ['id', 'type', 'amount', 'fee', 'discount', 'paymentId', 'receivementId', 'isConciled', 'message'], include: [
          { model: db.FinancialMovementInstallment, as: 'receivement', attributes: ['codigo_movimento_detalhe', 'amount', 'observation'], include: [
            { model: db.FinancialMovement, as: 'financialMovement', attributes: ['externalId'], include: [
              { model: db.Partner, as: 'partner', attributes: ['surname'] }
            ]}
          ]},
          { model: db.FinancialMovementInstallment, as: 'payment', attributes: ['codigo_movimento_detalhe', 'amount', 'observation'], include: [
            { model: db.FinancialMovement, as: 'financialMovement', attributes: ['externalId'], include: [
              { model: db.Partner, as: 'partner', attributes: ['surname'] }
            ]}
          ]},
          { model: db.Partner, as: 'partner', attributes: ['codigo_pessoa', 'surname'] },
          { model: db.FinancialCategory, as: 'category' },
          { model: db.BankAccount, as: 'origin', attributes: ['codigo_conta_bancaria', 'name', 'agency', 'number'], include: [
            { model: db.Bank, as: 'bank', attributes: ['id', 'name']}
          ]},
          { model: db.BankAccount, as: 'destination', attributes: ['codigo_conta_bancaria', 'name', 'agency', 'number'], include: [
            { model: db.Bank, as: 'bank', attributes: ['id', 'name']}
          ]}
        ]
      }
    ]
  });

  let cleanData = statementData.map(data => data.get({ plain: true }))

  cleanData = _.filter(cleanData, (c) => c.sourceId && c.description != 'reserve_for_debt_payment' && c.description != 'reserve_for_payout' && (parseFloat(c.credit) > 0 || parseFloat(c.debit) < 0))

  const allEntryTypes = [
    ...new Set(cleanData.map(data => data.entryType))
  ]

  const response = {
    ...statement.get({ plain: true }),
    statementData: cleanData,
    allEntryTypes
  }

  return response;

}

export async function create(formData) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  await db.transaction(async (transaction) => {

    const begin = format(addDays(new Date(formData.statement.begin), -60), 'dd/MM/yyyy HH:mm')
    const end = format(addDays(new Date(formData.statement.end), 30), 'dd/MM/yyyy HH:mm')

    await getTinyReceivements({start: begin, end: end})

    const statement = await db.Statement.create({
        companyId: session.company.codigo_empresa_filial,
        sourceId: formData.statement.sourceId,
        bankAccountId: formData.bankAccount?.codigo_conta_bancaria,
        begin: format(fromZonedTime(formData.statement.begin, Intl.DateTimeFormat().resolvedOptions().timeZone),'yyyy-MM-dd HH:mm'),
        end: format(fromZonedTime(formData.statement.end, Intl.DateTimeFormat().resolvedOptions().timeZone),'yyyy-MM-dd HH:mm'),
        //archiveId: archive.id,
        isActive: true
    }, {transaction})

    for (const item of formData.statement.statementData) {

      const statementData = await db.StatementData.create({statementId: statement.id, ...item, extra: JSON.stringify(item.extra)}, {transaction})

      if (item.entryType == `paid`) {

        const receivement = await db.FinancialMovementInstallment.findOne({
          attributes: ['codigo_movimento_detalhe', 'amount'],
          include: [
            {model: db.FinancialMovement, as: 'financialMovement', attributes: ['partnerId', 'categoryId']}
          ],
          where: [{
            [Sequelize.Op.or]: [
              { '$financialMovementInstallment.Descricao$': { [Sequelize.Op.like]: `%${item.reference}%` } }
            ]
          }],
          transaction
        })
        
        await db.StatementDataConciled.create({
          statementDataId: statementData.id,
          type: 1,
          partnerId: receivement?.financialMovement?.partnerId,
          categoryId: receivement?.financialMovement?.categoryId || 2,
          amount: receivement?.amount,
          receivementId: receivement?.codigo_movimento_detalhe,
        }, {transaction})

          
        if (parseFloat(statementData.fee) < 0) {
          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 2,
            partnerId: 159,
            categoryId: 21, //'2.05 - Taxas e Tarifas ecommerce
            amount: parseFloat(statementData.fee)},
            {transaction}
          );
        }

        if (parseFloat(statementData.shipping) < 0) {
          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 2,
            partnerId: 159,
            categoryId: 34, //'4.25 - Fretes
            amount: parseFloat(statementData.shipping)}, 
            {transaction}
          );
        }


      }

      if (item.entryType == `cancelled`) {

        await db.StatementDataConciled.create({
          statementDataId: statementData.id,
          type: `transfer`,
          originId: 1,
          destinationId: 15,
          amount: item.amount,
        }, {transaction})

      }

    }

  })

}

export async function destroy({ id }) {

  const db = new AppContext()

  await db.transaction(async (transaction) => {

    // Buscar todos os statementData que pertencem ao statement
    const statementDataList = await db.StatementData.findAll({
      where: { statementId: id },
      transaction
    })

    const statementDataIds = statementDataList.map(s => s.id)

    if (statementDataIds.length > 0) {
      // Apaga todos os conciliações vinculadas
      await db.StatementDataConciled.destroy({
        where: { statementDataId: statementDataIds },
        transaction
      })

      // Apaga os statementData vinculados
      await db.StatementData.destroy({
        where: { id: statementDataIds },
        transaction
      })
    }

    // Por fim apaga o statement
    await db.Statement.destroy({
      where: { id },
      transaction
    })

  })
}

export async function deleteData({id}) {
  
  const db = new AppContext()

  await db.transaction(async (transaction) => {

    await db.StatementDataConciled.destroy({
      where: [{statementDataId: id}],
      transaction
    })

    await db.StatementData.destroy({
      where: [{id: id}],
      transaction
    })

  })

}

export async function update(statementDataId, values) {

  const db = new AppContext()

  const payload = {
    statementDataId,
    type: values.type,
    partnerId: values.partner?.codigo_pessoa || null,
    categoryId: values.category?.id || null,
    originId: values.origin?.codigo_conta_bancaria || null,
    destinationId: values.destination?.codigo_conta_bancaria || null,
    amount: Number(values.amount) || 0,
    fee: Number(values.fee) || 0,
    discount: Number(values.discount) || 0,
  }

  if (values.id) {

    await db.StatementDataConciled.update(payload, { where: { id: values.id } });
    return { ...values, id: values.id }

  } else {

    const result = await db.StatementDataConciled.create(payload)
    return { ...values, id: result.id }

  }

}

export async function saveConciled(statementDataId, values) {

  const db = new AppContext()

  const payload = {
    statementDataId,
    type: values.type,
    partnerId: values.partner?.codigo_pessoa || null,
    categoryId: values.category?.id || null,
    originId: values.origin?.codigo_conta_bancaria || null,
    destinationId: values.destination?.codigo_conta_bancaria || null,
    amount: Number(values.amount) || 0,
    fee: Number(values.fee) || 0,
    discount: Number(values.discount) || 0,
  }

  if (values.id) {

    await db.StatementDataConciled.update(payload, { where: { id: values.id } });
    return { ...values, id: values.id }

  } else {

    const result = await db.StatementDataConciled.create(payload)
    return { ...values, id: result.id }

  }

}

export async function deleteConciled({id}) {

  const db = new AppContext()

  await db.StatementDataConciled.destroy({where: [{id}]})

}

export async function vinculePayment({statementDataConciledId, codigo_movimento_detalhe}) {
  
  const db = new AppContext()

  await db.StatementDataConciled.update({paymentId: codigo_movimento_detalhe}, {where: [{id: statementDataConciledId}]})

}

export async function vinculeReceivement({statementDataConciledId, codigo_movimento_detalhe}) {
  
  const db = new AppContext()

  const receivement = await db.FinancialMovementInstallment.findOne({
    attributes: ['codigo_movimento_detalhe'],
    include: [
      {model: db.FinancialMovement, as: 'financialMovement', attributes: ['partnerId', 'categoryId']}
    ],
    where: [{'$codigo_movimento_detalhe$': codigo_movimento_detalhe}]
  })

  await db.StatementDataConciled.update({
    receivementId: receivement.codigo_movimento_detalhe,
    partnerId: receivement.financialMovement.partnerId,
    categoryId: receivement.financialMovement.categoryId,
  }, 
  {where: [{id: statementDataConciledId}]}
  )

}

export async function desvincule({statementDataConciledId}) {
  
  const db = new AppContext()

  await db.StatementDataConciled.update({paymentId: null, receivementId: null}, {where: [{id: statementDataConciledId}]})

}

export async function concile({id}) {

  const db = new AppContext()

  const concileds = await db.StatementDataConciled.findAll({
    attributes: ['id', 'type', 'amount', 'paymentId', 'receivementId'],
    include: [
      {model: db.StatementData, as: 'statementData', attributes: ['id', 'entryDate'], include: [
        {model: db.Statement, as: 'statement', attributes: ['bankAccountId']}
      ]}
    ],
    where: [{id: id, isConciled: false}]
  })

  for (const item of concileds) {

    if (item.type == 1) {
      console.log('recebimento')
    }

    if (item.type == 2) {
      try {
        await payments.concile({
          codigo_movimento_detalhe: item.paymentId,
          date: item.statementData.entryDate,
          amount: item.amount,
          bankAccountId: item.statementData.statement.bankAccountId,
          observation: ''
        })
        await db.StatementDataConciled.update({isConciled: true, message: null}, {where: [{id: item.id}]})
      } catch (error) {
        await db.StatementDataConciled.update({message: error.message}, {where: [{id: item.id}]})
      }
    }

    if (item.type == 'transfer') {
      console.log('transferência')
    }

  }

}

export async function desconcile({id}) {

  const db = new AppContext()

  const concileds = await db.StatementDataConciled.findAll({
    attributes: ['id', 'type', 'paymentId'],
    where: [{id: id}]
  })

  for (const item of concileds) {
    try {
      await payments.desconcile({
        codigo_movimento_detalhe: item.paymentId
      })
      await db.StatementDataConciled.update({isConciled: false, message: null}, {where: [{id: item.id}]})
    } catch (error) {
      await db.StatementDataConciled.update({isConciled: false, message: error.message}, {where: [{id: item.id}]})
    }
   
  }

}

//excluir função - NÃO UTILIZADA
export async function refresh() {

  const r = await orders({companyIntegrationId: '00A649D7-C96A-47EB-BA71-87999EE16849', start: '2025-08-05', end: '2025-09-05'})

  console.log(r)

}