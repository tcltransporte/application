"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { addDays, format } from "date-fns"
import { fromZonedTime } from "date-fns-tz"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"
import { orders } from "../settings/integrations/plugins/mercado-livre.controller"
import { getTinyPayments, getTinyReceivements } from "@/utils/integrations/tiny"
import * as payments from "@/app/server/finances/payments"
import * as receivements from "@/app/server/finances/receivements"
import { authentication } from "../settings/integrations/index.controller"

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
    attributes: ['id'],
    include: [
      {
        model: db.BankAccount,
        as: 'bankAccount',
        attributes: ['codigo_conta_bancaria'],
      },
      {
        model: db.StatementData,
        as: 'statementData',
        where: {
          sourceId: { [Sequelize.Op.ne]: '' }
        },
        required: false,
        // ✅ Adicionado para garantir que a ordenação complexa funcione corretamente
        separate: true, 
        order: [
          ['sequence', 'ASC'],
          [Sequelize.literal('CASE WHEN [entryDate] IS NULL THEN 1 ELSE 0 END'), 'ASC'],
          ['entryDate', 'ASC'],
          ['reference', 'ASC'],
          [{ model: db.StatementDataConciled, as: 'concileds' }, 'type', 'ASC']
        ],
        include: [
          {
            model: db.StatementDataConciled,
            as: 'concileds',
            attributes: ['id','type','amount','fee','discount','paymentId','receivementId','isConciled','message'],
            include: [
              {
                model: db.FinancialMovementInstallment,
                as: 'receivement',
                attributes: ['codigo_movimento_detalhe','amount','observation', 'externalId'],
                include: [
                  {
                    model: db.FinancialMovement,
                    as: 'financialMovement',
                    attributes: ['codigo_movimento'],
                    include: [
                      { model: db.Partner, as: 'partner', attributes: ['surname'] }
                    ]
                  }
                ]
              },
              {
                model: db.FinancialMovementInstallment,
                as: 'payment',
                attributes: ['codigo_movimento_detalhe','amount','observation', 'externalId'],
                include: [
                 {
                    model: db.FinancialMovement,
                    as: 'financialMovement',
                    attributes: ['codigo_movimento'],
                    include: [
                     { model: db.Partner, as: 'partner', attributes: ['surname'] }
                    ]
                 }
               ]
              },
              { model: db.Partner, as: 'partner', attributes: ['codigo_pessoa','surname'] },
              { model: db.FinancialCategory, as: 'category' },
              {
                model: db.BankAccount,
                as: 'origin',
                attributes: ['codigo_conta_bancaria','name','agency','number'],
                include: [{ model: db.Bank, as: 'bank', attributes: ['id','name'] }]
              },
              {
                model: db.BankAccount,
                as: 'destination',
                attributes: ['codigo_conta_bancaria','name','agency','number'],
                include: [{ model: db.Bank, as: 'bank', attributes: ['id','name'] }]
              }
            ]
          }
        ]
      }
    ],
    where: { id: statementId }
  })

  if (!statement) return null

  return statement.get({ plain: true })

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

      const statementData = await db.StatementData.create({statementId: statement.id, ...item /*, extra: JSON.stringify(item.extra)*/}, {transaction})

      if (item.entryType == `payment`) {

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
            partnerId: 5333,
            categoryId: 21, //'2.05 - Taxas e Tarifas ecommerce
            amount: Number(statementData.fee) * -1},
            {transaction}
          );
        }

        if (parseFloat(statementData.shipping) < 0) {
          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 2,
            partnerId: 5333,
            categoryId: 34, //'4.25 - Fretes
            amount: Number(statementData.shipping) * -1}, 
            {transaction}
          );
        }

      }

      if (item.entryType == `cancelled`) {

        if (Number(item.credit) > 0) {

          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: `transfer`,
            originId: 15,
            destinationId: 1,
            amount: item.credit,
          }, {transaction})

        }

        if (Number(item.debit) < 0) {

          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: `transfer`,
            originId: 1,
            destinationId: 15,
            amount: item.debit * -1,
          }, {transaction})

        }

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
    attributes: ['id', 'type', 'partnerId', 'categoryId', 'amount', 'paymentId', 'receivementId'],
    include: [
      {model: db.StatementData, as: 'statementData', attributes: ['id', 'entryDate', 'sourceId', 'reference'], include: [
        {model: db.Statement, as: 'statement', attributes: ['bankAccountId']}
      ]},
      {model: db.BankAccount, as: 'origin', attributes: ['externalId']},
      {model: db.BankAccount, as: 'destination', attributes: ['externalId']}
    ],
    where: [{id: id, isConciled: false}]
  })

  for (const item of concileds) {

    if (item.type == 1) {
      try {

        if (!item.receivementId) {

          const installment = await receivements.insert({
            company: {
              codigo_empresa_filial: 2,
            },
            amount: item.amount,
            installment: 1,
            issueDate: item.statementData.entryDate,
            startDate: item.statementData.entryDate,
            bankAccount: null,
            receiver: { codigo_pessoa: item.partnerId },
            observation: '',
            installments: [
              {
                installment: 1,
                amount: item.amount,
                dueDate: item.statementData.entryDate,
                digitableLine: '',
                boletoNumber: ''
              }
            ],
            category: { id: item.categoryId }
          })

          item.receivementId = installment
          
          await item.save()

        }

        await receivements.concile({
          codigo_movimento_detalhe: item.receivementId,
          date: item.statementData.entryDate,
          amount: item.amount,
          bankAccountId: item.statementData.statement.bankAccountId,
          observation: `Integração: ${item.statementData?.sourceId} | ${item.statementData?.reference}`
        })

        await db.StatementDataConciled.update({isConciled: true, message: null}, {where: [{id: item.id}]})
        
      } catch (error) {
        await db.StatementDataConciled.update({message: error.message}, {where: [{id: item.id}]})
      }
    }

    if (item.type == 2) {
      try {

        if (!item.paymentId) {

          const installment = await payments.insert({
            company: {
              codigo_empresa_filial: 2,
            },
            amount: Number(item.amount),
            installment: 1,
            issueDate: item.statementData.entryDate,
            startDate: item.statementData.entryDate,
            bankAccount: null,
            receiver: { codigo_pessoa: item.partnerId },
            observation: '',
            installments: [
              {
                installment: 1,
                amount: item.amount,
                dueDate: item.statementData.entryDate,
                digitableLine: '',
                boletoNumber: ''
              }
            ],
            category: { id: item.categoryId }
          })

          item.paymentId = installment

          await item.save()

        }
       
        await payments.concile({
          codigo_movimento_detalhe: item.paymentId,
          date: item.statementData.entryDate,
          amount: item.amount,
          bankAccountId: item.statementData.statement.bankAccountId,
          observation: `Integração: ${item.statementData?.sourceId} | ${item.statementData?.reference}`
        })

        await db.StatementDataConciled.update({isConciled: true, message: null}, {where: [{id: item.id}]})
      

      } catch (error) {
        await db.StatementDataConciled.update({message: error.message}, {where: [{id: item.id}]})
      }
    }

    if (item.type == 'transfer') {
      await transfer({
        date: item.statementData.entryDate,
        amount: item.amount,
        originId: item.origin?.externalId,
        destinationId: item.destination?.externalId,
        observation: `Integração: ${item.statementData?.sourceId} | ${item.statementData?.reference}`
      })

      await db.StatementDataConciled.update({isConciled: true, message: null}, {where: [{id: item.id}]})

    }

  }

}

export async function desconcile({id}) {

  const db = new AppContext()

  const concileds = await db.StatementDataConciled.findAll({
    attributes: ['id', 'type', 'partnerId', 'categoryId', 'amount', 'paymentId', 'receivementId'],
    where: [{id: id, isConciled: true}]
  })

  for (const item of concileds) {
    try {

      if (item.type == 1) {

        if (item.receivementId) {
          
          await receivements.desconcile({
            codigo_movimento_detalhe: item.receivementId
          })

          await db.StatementDataConciled.update({isConciled: false, message: null}, {where: [{id: item.id}]})

        }

      }

      if (item.type == 2) {

        if (item.receivementId) {
          
          await receivements.desconcile({
            codigo_movimento_detalhe: item.receivementId
          })

          await db.StatementDataConciled.update({isConciled: false, message: null}, {where: [{id: item.id}]})

        }

        if (item.paymentId) {

          await payments.desconcile({
            codigo_movimento_detalhe: item.paymentId
          })

          await db.StatementDataConciled.update({isConciled: false, message: null}, {where: [{id: item.id}]})

        }

      }

    } catch (error) {
      await db.StatementDataConciled.update({message: error.message}, {where: [{id: item.id}]})
    }
   
  }

}

async function transfer({date, originId, destinationId, amount, observation = ''}) {

  const auth = await authentication({
    companyIntegrationId: '92075C95-6935-4FA4-893F-F22EA9B55B5C'
  })

  const args = `[{"data":"${format(date, 'dd/MM/yyyy')}","valor":"${amount.toString().replace('.', ',')}","idContaOrigem":"${originId}","idContaDestino":"${destinationId}","historicoTransferencia":"${observation}"}]`

  const data = `argsLength=${args.length}&args=${args}`

  const res = await fetch("https://erp.tiny.com.br/services/caixa.server/2/Caixa/salvarTransferencia", {
    "headers": {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "priority": "u=1, i",
      "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-custom-request-for": "XAJAX",
      "x-requested-with": "XMLHttpRequest",
      "x-user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "cookie": `TINYSESSID=${auth.TINYSESSID};_csrf_token=${auth._csrf_token}`,
      "Referer": "https://erp.tiny.com.br/caixa",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": data, //"argsLength=149&timeInicio=1758132000767&versaoFront=3.80.38&pageTime=1758131952&pageLastPing=1758131959873&location=https%3A%2F%2Ferp.tiny.com.br%2Fcaixa&curRetry=0&args=%5B%7B%22data%22%3A%2217%2F09%2F2025%22%2C%22valor%22%3A%220%2C01%22%2C%22idContaOrigem%22%3A%22351099665%22%2C%22idContaDestino%22%3A%22351167825%22%2C%22historicoTransferencia%22%3A%22Transfer%C3%AAncia+entre+contas%22%7D%5D",
    "method": "POST"
  });

  const r = await res.json()

  if (r.response[0].cmd == 'rj') {
      throw new Error(r.response[0]?.exc?.detail)
  }

}

//excluir função - NÃO UTILIZADA
export async function refresh() {

  const r = await orders({companyIntegrationId: '00A649D7-C96A-47EB-BA71-87999EE16849', start: '2025-08-05', end: '2025-09-05'})

  console.log(r)

}