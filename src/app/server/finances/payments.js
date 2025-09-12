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

  whereClauses.push({
    [Sequelize.Op.or]: [
      { '$financialMovement.financialCategory.codigo_tipo_operacao$': 2 },
      { '$financialMovement.type_operation$': 2 } // aqui vai o outro campo que você quer
    ]
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

export async function desconcile({codigo_movimento_detalhe}) {

  const db = new AppContext()

  const payment = await db.FinancialMovementInstallment.findOne({
    attributes: ['codigo_movimento_detalhe'],
    include: [
      {model: db.FinancialMovement, as: 'financialMovement', attributes: ['externalId']}
    ],
    where: [{codigo_movimento_detalhe: codigo_movimento_detalhe}]
  })

  const companyIntegration = await db.CompanyIntegration.findOne({
    attributes: ['id', 'options'],
    where: [{id: '92075C95-6935-4FA4-893F-F22EA9B55B5C'}]
  })

  const options = JSON.parse(companyIntegration.options)

  console.log(options)

  const args = `[["${payment.financialMovement.externalId}"],false]`;
  const data = new URLSearchParams();
  data.append('argsLength', args.length);
  data.append('args', args);

  const response = await fetch('https://erp.tiny.com.br/services/contas.pagar.server/1/excluirBorderos', {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': `TINYSESSID=${options.TINYSESSID};_csrf_token=${options._csrf_token}`,
      'Origin': 'https://erp.tiny.com.br',
      'Referer': 'https://erp.tiny.com.br/caixa',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'x-custom-request-for': 'XAJAX',
      'x-requested-with': 'XMLHttpRequest',
      'x-user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    },
    body: data
  })

  const result = await response.json()

  console.log(result)

  //if (result[0].cmd != 'jc') {
  //  throw new Error('Erro ao desconciliar!')
  //}

}

export async function concile({codigo_movimento_detalhe, bankAccountId, date, amount, observation}) {

  const db = new AppContext()

  const payment = await db.FinancialMovementInstallment.findOne({
    attributes: ['codigo_movimento_detalhe'],
    include: [
      {model: db.FinancialMovement, as: 'financialMovement', attributes: ['externalId']}
    ],
    where: [{codigo_movimento_detalhe: codigo_movimento_detalhe}]
  })

  const bankAccount = await db.BankAccount.findOne({
    attributes: ['name'],
    where: [{codigo_conta_bancaria: bankAccountId}]
  })

  //console.log(payment.financialMovement.externalId)

  //console.log({codigo_movimento_detalhe, date, bankAccountId, amount, observation})

  //return
  
  const url = `https://api.tiny.com.br/api2/conta.pagar.baixar.php?token=334dbca19fc02bb1339af70e1def87b5b26cdec61c4976760fe6191b5bbb1ebf&conta=${encodeURIComponent(
    JSON.stringify({
      conta: {
        id: payment.financialMovement.externalId,
        data: format(new Date(date), 'dd/MM/yyyy'),
        contaOrigem: bankAccount.name,
        valorPago: amount * -1,
        historico: `Integração:`
      }
    })
  )}&formato=JSON`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })

  const r = await response.json()

  if (r.retorno.status == 'Erro') {
    console.log(r.retorno.registros[0].registro.erros[0].erro)
    throw new Error(r.retorno.registros[0].registro.erros[0].erro)
  }

}

export async function destroy({ codigo_conta_bancaria }) {
  const session = await getServerSession(authOptions)
  const db = new AppContext()
  return db.BankAccount.destroy({ where: { codigo_conta_bancaria } })
}