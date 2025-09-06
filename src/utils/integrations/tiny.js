"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format, parse } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getTinyPartner(search) {
  
    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const companyIntegration = await db.CompanyIntegration.findOne({
      attributes: ['options'],
      where: [
        {
          integrationId: 'E6F39F15-5446-42A7-9AC4-A9A99E604F07',
          companyId: session.company.codigo_empresa_filial,
        },
      ],
    })

    if (companyIntegration) {

      const options = JSON.parse(companyIntegration.options)

      await db.transaction(async (transaction) => {

        const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${options.token}&formato=json&pesquisa=${search}`

        const response = await fetch(url, { method: 'GET' })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const r = await response.json()

        const externalIdsFromApi = _.map(r.retorno.contatos, item => _.get(item, 'contato.id'))
    
        const existingPartners = await db.Partner.findAll({
          where: {
            externalId: externalIdsFromApi,
          },
          transaction,
          attributes: ['externalId'],
        })
    
        const existingExternalIds = existingPartners.map((p) => p.externalId)
    
        const newPartners = _(r.retorno.contatos)
          .filter(item => !_.includes(existingExternalIds, _.get(item, 'contato.id')))
          .map(item => ({
            companyId: session.company.codigo_empresa_filial,
            externalId: _.get(item, 'contato.id'),
            surname: _.get(item, 'contato.nome'),
          }))
          .value()
    
        if (newPartners.length > 0) {
          await db.Partner.bulkCreate(newPartners, { transaction })
        }
    
      })

    }

}

export async function getTinyCategories(search) {
  try {
                    
    const session = await getServerSession(authOptions)
    
    const db = new AppContext()
    
    const companyIntegration = await db.CompanyIntegration.findOne({
      attributes: ['options'],
      where: [
        {
          integrationId: 'E6F39F15-5446-42A7-9AC4-A9A99E604F07',
          companyId: session.company.codigo_empresa_filial,
        },
      ],
    })

    if (companyIntegration) {

      const options = JSON.parse(companyIntegration.dataValues.options)

      const args = `[{"queryKey":["conta.pagar.categorias.financeiras"],"signal":{"aborted":false,"onabort":null}}]`
      const data = `argsLength=${_.size(args)}&args=${encodeURIComponent(args)}`

      const response = await fetch(
        'https://erp.tiny.com.br/services/contas.pagar.server/2/CategoriaFinanceira%5CCategoriaFinanceira/obterOpcoesSelectCategorias',
        {
          method: 'POST',
          headers: {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'cookie': `TINYSESSID=${options.TINYSESSID}; _csrf_token=${options._csrf_token}`,
            'origin': 'https://erp.tiny.com.br',
            'referer': 'https://erp.tiny.com.br/caixa',
            'user-agent': 'Mozilla/5.0',
            'x-custom-request-for': 'XAJAX',
            'x-requested-with': 'XMLHttpRequest',
            'x-user-agent': 'Mozilla/5.0'
          },
          body: data
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseJson = await response.json()

      const retorno = _.flatMap(responseJson.response[0].val, item => item.categorias)

      const retornoUnico = _.uniqBy(retorno, item => String(item.id))

      await db.transaction(async (transaction) => {
        for (const item of retornoUnico) {

          const externalId = String(item.id)

          await db.FinancialCategory.findOrCreate({
            where: { externalId },
            defaults: {
              companyBusinessId: session.company.companyBusiness.codigo_empresa,
              code: externalId,
              account: externalId,
              description: item.desc,
              isActive: true
            },
            transaction
          })
        }
      })

    }

    
  } catch (error) {

  }
}

export async function getTinyPayments({ start, end }) {
  try {

    await getTinyCategories()

    const session = await getServerSession(authOptions)
    const db = new AppContext()

    const companyIntegration = await db.CompanyIntegration.findOne({
      attributes: ['options'],
      where: [
        {
          integrationId: 'E6F39F15-5446-42A7-9AC4-A9A99E604F07',
          companyId: session.company.codigo_empresa_filial,
        },
      ],
    })

    if (companyIntegration) {
      const options = JSON.parse(companyIntegration.dataValues.options)

      const payments = async ({ token, start, end, offset }) => {
        const url = `https://api.tiny.com.br/api2/contas.pagar.pesquisa.php?token=${token}&formato=json&data_ini_vencimento=${start}&data_fim_vencimento=${end}&pagina=${offset}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Erro ao buscar página ${offset}: ${res.statusText}`)
        return await res.json()
      }

      const paymentDetails = async ({ token, id }) => {
        const url = `https://api.tiny.com.br/api2/conta.pagar.obter.php?token=${token}&id=${id}&formato=json`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Erro ao buscar id ${id}: ${res.statusText}`)
        return await res.json()
      }

      const firstPage = await payments({ token: options.token, start, end, offset: 1 })
      const totalPages = Number(firstPage?.retorno?.numero_paginas) || 1
      let contas = [...(firstPage?.retorno?.contas || [])]

      if (totalPages > 1) {
        const promises = []
        for (let i = 2; i <= totalPages; i++) {
          promises.push(payments({ token: options.token, start, end, offset: i }))
        }
        const responses = await Promise.all(promises)
        for (const response of responses) {
          contas.push(...(response?.retorno?.contas || []))
        }
      }

      await db.transaction(async (transaction) => {
        // 1. Garantir que os parceiros existem
        const partnerNames = _.uniq(contas.map((item) => item.conta.nome_cliente).filter(Boolean))
        const existingPartners = await db.Partner.findAll({
          where: { surname: partnerNames },
          transaction,
        })

        const partnerMap = new Map(existingPartners.map((p) => [p.surname, p]))

        for (const name of partnerNames) {
          if (!partnerMap.has(name)) {
            const newPartner = await db.Partner.create({ surname: name }, { transaction })
            partnerMap.set(name, newPartner)
          }
        }

        // 2. Mapear pagamentos
        const allPayments = contas.map((item) => {
          const id = item.conta.id
          const name = item.conta.nome_cliente
          const partner = partnerMap.get(name)

          return {
            externalId: id,
            documentNumber: id,
            amountTotal: item.conta.valor,
            issueDate: format(parse(item.conta.data_emissao, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
            dueDate: format(parse(item.conta.data_vencimento, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
            observation: item.conta.historico,
            partnerId: partner?.codigo_pessoa || null,
          }
        })

        // 3. Buscar movimentos financeiros existentes
        const existingMovements = await db.FinancialMovement.findAll({
          where: {
            externalId: allPayments.map((p) => p.externalId),
          },
          transaction,
        })

        const existingMap = new Map(existingMovements.map((m) => [m.externalId, m]))

        const toCreate = []

        for (const payment of allPayments) {
          if (!existingMap.has(payment.externalId)) {
            const detail = await paymentDetails({ token: options.token, id: payment.externalId })

            if (detail.retorno.conta?.categoria) {
              const categorie = await db.FinancialCategory.findOne({
                attributes: ['id'],
                where: [{ Descricao: detail.retorno.conta?.categoria }],
                transaction,
              })
              payment.categoryId = categorie?.dataValues.id
            }
            
            payment.type_operation = 2
            payment.companyId = session.company.companyBusiness.codigo_empresa
            toCreate.push(payment)

          }
        }

        const createdMovements = await db.FinancialMovement.bulkCreate(toCreate, {
          transaction,
          returning: true,
        })

        const allMovements = createdMovements
        const movementMap = new Map(allMovements.map((m) => [m.externalId, m]))

        // 4. Criar parcelas apenas para os novos registros
        for (const payment of toCreate) {
          const movement = movementMap.get(payment.externalId)

          if (!movement) continue

          await db.FinancialMovementInstallment.findOrCreate({
            where: {
              financialMovementId: movement?.codigo_movimento,
              installment: 1,
            },
            defaults: {
              issueDate: payment.issueDate,
              dueDate: payment.dueDate,
              amount: payment.amountTotal,
              observation: payment.observation,
            },
            transaction,
          })
        }

      })

    }

  } catch (error) {

  }
}

export async function getTinyReceivements({ start, end }) {

  await getTinyCategories()

  const session = await getServerSession(authOptions)
  const db = new AppContext()

  const companyIntegration = await db.CompanyIntegration.findOne({
    attributes: ['options'],
    where: [
      {
        integrationId: 'E6F39F15-5446-42A7-9AC4-A9A99E604F07',
        companyId: session.company.codigo_empresa_filial,
      },
    ],
  })

  if (companyIntegration) {
    const options = JSON.parse(companyIntegration.dataValues.options)

    const receivements = async ({ token, start, end, offset }) => {
      const url = `https://api.tiny.com.br/api2/contas.receber.pesquisa.php?token=${token}&formato=json&data_ini_vencimento=${start}&data_fim_vencimento=${end}&pagina=${offset}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erro ao buscar página ${offset}: ${res.statusText}`)
      return await res.json()
    }

    const receivementDetails = async ({ token, id }) => {
      const url = `https://api.tiny.com.br/api2/conta.receber.obter.php?token=${token}&id=${id}&formato=json`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erro ao buscar id ${id}: ${res.statusText}`)
      return await res.json()
    }

    const firstPage = await receivements({ token: options.token, start, end, offset: 1 })
    const totalPages = Number(firstPage?.retorno?.numero_paginas) || 1
    let contas = [...(firstPage?.retorno?.contas || [])]

    if (totalPages > 1) {
      const promises = []
      for (let i = 2; i <= totalPages; i++) {
        promises.push(receivements({ token: options.token, start, end, offset: i }))
      }
      const responses = await Promise.all(promises)
      for (const response of responses) {
        contas.push(...(response?.retorno?.contas || []))
      }
    }

    await db.transaction(async (transaction) => {
      // 1. Garantir que os parceiros existem
      const partnerNames = _.uniq(contas.map((item) => item.conta.nome_cliente).filter(Boolean))
      const existingPartners = await db.Partner.findAll({
        where: { surname: partnerNames },
        transaction,
      })

      const partnerMap = new Map(existingPartners.map((p) => [p.surname, p]))

      for (const name of partnerNames) {
        if (!partnerMap.has(name)) {
          const newPartner = await db.Partner.create({ surname: name }, { transaction })
          partnerMap.set(name, newPartner)
        }
      }

      // 2. Mapear pagamentos
      const allPayments = contas.map((item) => {
        const id = item.conta.id
        const name = item.conta.nome_cliente
        const partner = partnerMap.get(name)

        return {
          externalId: id,
          documentNumber: id,
          amountTotal: item.conta.valor,
          issueDate: format(parse(item.conta.data_emissao, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
          dueDate: format(parse(item.conta.data_vencimento, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
          observation: item.conta.historico,
          partnerId: partner?.codigo_pessoa || null,
        }
      })

      // 3. Buscar movimentos financeiros existentes
      const existingMovements = await db.FinancialMovement.findAll({
        where: {
          externalId: allPayments.map((p) => p.externalId),
        },
        transaction,
      })

      const existingMap = new Map(existingMovements.map((m) => [m.externalId, m]))

      const toCreate = []

      for (const receivement of allPayments) {
        if (!existingMap.has(receivement.externalId)) {
          const detail = await receivementDetails({ token: options.token, id: receivement.externalId })
          
          if (detail.retorno.conta?.categoria) {
            const categorie = await db.FinancialCategory.findOne({
              attributes: ['id'],
              where: [{ Descricao: detail.retorno.conta?.categoria }],
              transaction,
            })
            receivement.categoryId = categorie?.dataValues.id
          }
          receivement.type_operation = 1
          receivement.companyId = session.company.companyBusiness.codigo_empresa
          toCreate.push(receivement)

        }
      }

      const createdMovements = await db.FinancialMovement.bulkCreate(toCreate, {
        transaction,
        returning: true,
      })

      const allMovements = createdMovements
      const movementMap = new Map(allMovements.map((m) => [m.externalId, m]))

      // 4. Criar parcelas apenas para os novos registros
      for (const payment of toCreate) {
        const movement = movementMap.get(payment.externalId)

        if (!movement) continue

        await db.FinancialMovementInstallment.findOrCreate({
          where: {
            financialMovementId: movement?.codigo_movimento,
            installment: 1,
          },
          defaults: {
            issueDate: payment.issueDate,
            dueDate: payment.dueDate,
            amount: payment.amountTotal,
            observation: payment.observation,
          },
          transaction,
        })
      }

    })

  }
}