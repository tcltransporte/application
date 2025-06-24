"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

import _ from "lodash"
import { Sequelize } from "sequelize"

export async function getStatement({ statementId }) {

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
    where: {
      statementId: statement.id,
      //entryType: { [Sequelize.Op.in]: entryTypesArray }
    },
    order: [
      [Sequelize.literal('CASE WHEN [entryDate] IS NULL THEN 1 ELSE 0 END'), 'ASC'],
      ['entryDate', 'ASC']
    ],
    include: [
      {
        model: db.StatementDataConciled,
        as: 'concileds',
        include: [
          { model: db.Partner, as: 'partner' },
          { model: db.FinancialCategory, as: 'category' }
        ]
      }
    ]
  });

  const cleanData = statementData.map(data => data.get({ plain: true }))

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


export async function saveStatementConciled(statementDataId, values) {

  const db = new AppContext()

  const payload = {
    statementDataId,
    type: values.type,
    partnerId: values.partner?.codigo_pessoa || null,
    categoryId: values.category?.id || null,
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

export async function deleteStatementConciled({id}) {

  const db = new AppContext()

  await db.StatementDataConciled.destroy({where: [{id}]})

}

export async function vinculePayment({statementDataConciledId, codigo_movimento_detalhe}) {
  
  const db = new AppContext()

  await db.StatementDataConciled.update({paymentId: codigo_movimento_detalhe}, {where: [{id: statementDataConciledId}]})

}

export async function desvinculePayment({statementDataConciledId}) {
  
  const db = new AppContext()

  await db.StatementDataConciled.update({paymentId: null}, {where: [{id: statementDataConciledId}]})

}