"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { addDays, format } from "date-fns"
import { fromZonedTime } from "date-fns-tz"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"
import { orders } from "../settings/integrations/plugins/mercado-livre.controller"
//import { getTinyPayments, getTinyReceivements } from "@/utils/integrations/tiny"
import * as payments from "@/app/server/finances/payments"
import * as receivements from "@/app/server/finances/receivements"
//import { authentication } from "../settings/integrations/index.controller"
import * as sincronize from "@/app/server/sincronize"

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
          //sourceId: { [Sequelize.Op.ne]: '' }
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

  const ret = statement.get({ plain: true })

  return ret

}

export async function create(formData) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  let statement

  await db.transaction(async (transaction) => {

    statement = await db.Statement.create({
        companyId: session.company.codigo_empresa_filial,
        sourceId: formData.statement.sourceId,
        bankAccountId: formData.bankAccount?.codigo_conta_bancaria,
        begin: format(fromZonedTime(formData.statement.begin, Intl.DateTimeFormat().resolvedOptions().timeZone),'yyyy-MM-dd HH:mm'),
        end: format(fromZonedTime(formData.statement.end, Intl.DateTimeFormat().resolvedOptions().timeZone),'yyyy-MM-dd HH:mm'),
        //archiveId: archive.id,
        status: 'pending',
        isActive: true
    }, {transaction})

  })

  db.transaction(async (transaction) => {
    try {

      const begin = addDays(new Date(formData.statement.begin), -20)
      const end = addDays(new Date(formData.statement.end), 20)

      await sincronize.receivements({start: begin, end: end})

      const options = await db.BankAccount.findOne({attributes: ['statement'], where: [{codigo_conta_bancaria: formData.bankAccount?.codigo_conta_bancaria}]})

      const settings = JSON.parse(options.statement)

      for (const item of formData.statement.statementData) {

        const statementData = await db.StatementData.create({statementId: statement.id, ...item /*, extra: JSON.stringify(item.extra)*/}, {transaction})

        if (item.entryType == `receivement`) {

          const receivement = await db.FinancialMovementInstallment.findOne({
            attributes: ['codigo_movimento_detalhe', 'amount'],
            include: [
              {model: db.FinancialMovement, as: 'financialMovement', attributes: ['partnerId', 'categoryId']}
            ],
            where: [{
              [Sequelize.Op.and]: [
                { '$financialMovement.CodigoEmpresaFilial$': session.company.codigo_empresa_filial },
                { '$financialMovementInstallment.Descricao$': { [Sequelize.Op.like]: `%${item.reference}%` } }
              ]
            }],
            transaction
          })
          
          if (receivement) {

            if (Number(receivement?.amount) > 0) {
              await db.StatementDataConciled.create({
                statementDataId: statementData.id,
                type: 1,
                partnerId: receivement?.financialMovement?.partnerId,
                categoryId: receivement?.financialMovement?.categoryId || settings?.receivement?.categoryId,
                amount: Number(item.amount),
                receivementId: receivement?.codigo_movimento_detalhe,
              }, {transaction})
            }
          
            if (Number(statementData.fee) < 0) {
              await db.StatementDataConciled.create({
                statementDataId: statementData.id,
                type: 2,
                partnerId: settings?.fee?.partnerId,
                categoryId: settings?.fee?.categoryId,
                amount: Math.abs(Number(statementData.fee))},
                {transaction}
              );
            }

            if (Number(statementData.shipping) < 0) {

              await db.StatementDataConciled.create({
                statementDataId: statementData.id,
                type: 2,
                partnerId: settings?.shipping?.partnerId,
                categoryId: settings?.shipping?.categoryId,
                amount: Math.abs(Number(statementData.shipping))}, 
                {transaction}
              );

              //Rembolso de frete
              /*
              const conciled = Number(receivement?.amount) + Number(statementData.fee) + Number(statementData.shipping)
              const diff = Number(conciled) - Number(statementData.credit)
  
              if (Number(diff).toFixed(2) - Number(statementData.shipping).toFixed(2) == 0) {
                await db.StatementDataConciled.create({
                  statementDataId: statementData.id,
                  type: 1,
                  partnerId: 690,
                  categoryId: 1100,
                  amount: Math.abs(Number(statementData.shipping))}, 
                  {transaction}
                );
              }
              */

            }

            /*
            if (Number(statementData.shippingRefund) < 0) {

              await db.StatementDataConciled.create({
                statementDataId: statementData.id,
                type: 1,
                partnerId: 690,
                categoryId: 1100,
                amount: Math.abs(Number(statementData.shippingRefund))}, 
                {transaction}
              );

            }*/

          }
          
          continue

        }

        if (item.entryType == 'reserve_for_debt_payment') {

          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 2,
            partnerId: settings?.reserve_for_debt_payment?.partnerId,
            categoryId: settings?.reserve_for_debt_payment?.categoryId,
            amount: Math.abs(Number(statementData.debit))},
            {transaction}
          );

          continue

        }

        if (item.entryType == 'credit_payment') {

          let originId = undefined;
          let destinationId = undefined;
          let amount = 0;

          const credit_payment_originId = 105
          const credit_payment_destinationId = 123

          if (parseFloat(statementData.debit) < 0) {
            originId = credit_payment_originId
            destinationId = credit_payment_destinationId
            amount = parseFloat(statementData.debit) * -1;
          }

          if (parseFloat(statementData.credit) > 0) {
            originId = credit_payment_destinationId
            destinationId = credit_payment_originId
            amount = parseFloat(statementData.credit);
          }

          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 'transfer',
            originId,
            destinationId,
            amount: amount}, {transaction}
          );

          continue

        }

        if (item.entryType == 'reserve_for_dispute') {

          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 2,
            partnerId: settings?.reserve_for_dispute?.partnerId,
            categoryId: settings?.reserve_for_dispute?.categoryId,
            amount: Number(statementData.debit) * -1},
            {transaction}
          );

          continue

        }

        if (item.entryType == 'mediation') {

          let originId = undefined;
          let destinationId = undefined;
          let amount = 0;

          if (parseFloat(statementData.debit) < 0) {
            originId = settings?.mediation?.originId;
            destinationId = settings?.mediation?.destinationId;
            amount = parseFloat(statementData.debit) * -1;
          }

          if (parseFloat(statementData.credit) > 0) {
            originId = settings?.mediation?.destinationId;
            destinationId = settings?.mediation?.originId;
            amount = parseFloat(statementData.credit);
          }

          await db.StatementDataConciled.create({
            statementDataId: statementData.id,
            type: 'transfer',
            originId,
            destinationId,
            amount: amount}, {transaction}
          );

          continue
            
        }

      }

      await db.Statement.update({status: 'completed'}, { where: [{id: statement.id}], transaction })

    } catch (error) {
      console.log(error.message)
      await db.Statement.update({status: 'error'}, { where: [{id: statement.id}], transaction })

    }
  })

}

export async function destroy({ id }) {

  const db = new AppContext()

  return await db.transaction(async (transaction) => {

    const concileds = await db.StatementDataConciled.count({
      where: { '$statementData.statementId$': id },
      transaction,
    })

    if (concileds > 0) {
      throw new Error('Já existe registros conciliados');
    }

    // Buscar todos os statementData que pertencem ao statement
    const statementDataList = await db.StatementData.findAll({
      where: { '$statementData.statementId$': id },
      transaction,
    })

    const statementDataIds = statementDataList.map((s) => s.id);

    if (statementDataIds.length > 0) {
      // Apaga todas as conciliações vinculadas
      await db.StatementDataConciled.destroy({
        where: { statementDataId: statementDataIds },
        transaction,
      })

      // Apaga os statementData vinculados
      await db.StatementData.destroy({
        where: { id: statementDataIds },
        transaction,
      })
    }

    // Por fim, apaga o statement
    await db.Statement.destroy({
      where: { id },
      transaction,
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

  const payment = await db.FinancialMovementInstallment.findOne({
    attributes: ['codigo_movimento_detalhe'],
    include: [
      {model: db.FinancialMovement, as: 'financialMovement', attributes: ['partnerId', 'categoryId']}
    ],
    where: [{'$codigo_movimento_detalhe$': codigo_movimento_detalhe}]
  })

  await db.StatementDataConciled.update(
    {
      paymentId: payment.codigo_movimento_detalhe,
      partnerId: payment.financialMovement?.partnerId,
      categoryId: payment.financialMovement?.categoryId,
    }, 
    {
      where: [{id: statementDataConciledId}]
    }
  )

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

  await db.StatementDataConciled.update(
    {
      receivementId: receivement.codigo_movimento_detalhe,
      partnerId: receivement.financialMovement?.partnerId,
      categoryId: receivement.financialMovement?.categoryId,
    }, 
    {
      where: [{id: statementDataConciledId}]
    }
  )

}

export async function desvincule({statementDataConciledId}) {
  
  const db = new AppContext()

  await db.StatementDataConciled.update({paymentId: null, receivementId: null}, {where: [{id: statementDataConciledId}]})

}

export async function concile({id}) {

  const db = new AppContext()

  await db.transaction(async (transaction) => {

    const concileds = await db.StatementDataConciled.findAll({
      attributes: ['id', 'type', 'partnerId', 'categoryId', 'amount', 'paymentId', 'receivementId'],
      include: [
        {model: db.StatementData, as: 'statementData', attributes: ['id', 'entryDate', 'sourceId', 'reference'], include: [
          {model: db.Statement, as: 'statement', attributes: ['bankAccountId']}
        ]},
        {model: db.BankAccount, as: 'origin', attributes: ['externalId']},
        {model: db.BankAccount, as: 'destination', attributes: ['externalId']}
      ],
      where: [{id: id, isConciled: false}],
      transaction
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
            observation: `Integração: ${item.statementData?.sourceId} | ${item.statementData?.reference || ''}`
          })

          await db.StatementDataConciled.update({isConciled: true, message: null}, {where: [{id: item.id}]})

        } catch (error) {
          await db.StatementDataConciled.update({message: error.message}, {where: [{id: item.id}]})
        }
      }

      if (item.type == 'transfer') {
        await sincronize.transfer({
          date: item.statementData.entryDate,
          amount: item.amount,
          originId: item.origin?.externalId,
          destinationId: item.destination?.externalId,
          observation: `Integração: ${item.statementData?.sourceId} | ${item.statementData?.reference || ''}`
        })

        await db.StatementDataConciled.update({isConciled: true, message: null}, {where: [{id: item.id}]})

      }

    }

  })

}

export async function desconcile({id}) {

  const db = new AppContext()

  const concileds = await db.StatementDataConciled.findAll({
    attributes: ['id', 'type', 'partnerId', 'categoryId', 'amount', 'paymentId', 'receivementId'],
    where: [{id: id, isConciled: true}],
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