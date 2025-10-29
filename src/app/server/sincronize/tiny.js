"use server"

import { AppContext } from "@/database"

import { authOptions } from "@/libs/auth"
import { format, getTime, parse } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"

import { chromium } from 'playwright';
import { Op, Sequelize } from "sequelize"


// 🔹 Controle de taxa Tiny API
const MAX_REQUESTS_PER_MINUTE = 60; // Exemplo: 60 chamadas por minuto
const DELAY_MS = 60000 / MAX_REQUESTS_PER_MINUTE; // 60000 ms = 1 minuto

let lastCallTime = 0;

export async function rateLimitedFetch() {
  const now = Date.now();
  const elapsed = now - lastCallTime;

  if (elapsed < DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS - elapsed));
  }

  lastCallTime = Date.now();
}

export async function authentication({ companyIntegrationId }) {
  try {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const where = []

    if (companyIntegrationId) {
      where.push({ id: companyIntegrationId })
    }

    where.push({ companyId: session.company.codigo_empresa_filial })
    where.push({ integrationId: 'E6F39F15-5446-42A7-9AC4-A9A99E604F07' })

    const companyIntegration = await db.CompanyIntegration.findOne({
      attributes: ['id', 'options'],
      where
    })

    let options = JSON.parse(companyIntegration.options)

    const timestamp = getTime(new Date())

    const url = `https://erp.tiny.com.br/services/auth.services.php?a=ping&time=${timestamp}`

    await rateLimitedFetch();

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'cookie': `TINYSESSID=${options.TINYSESSID};_csrf_token=${options._csrf_token};`
        }
    })

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.text()

    if (data.includes(`"status":0`)) {
        return options
    }

    if (data.includes("Sua sessão expirou")) {
        
      const access = await login({username: options.username, password: options.password})

      options.TINYSESSID = access.tinySession
      options._csrf_token = access.csrfToken

      await db.CompanyIntegration.update({ options: JSON.stringify(options) }, { where: [{ id: companyIntegration.id }] })

      return options

    }

    throw new Error(`Não foi possível conectar ao tiny!`)

  } catch (error) {
      throw error
  }
}

export async function login({username, password}) {
    
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--lang=pt-BR'
        ]
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {

        await page.goto('https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth?client_id=tiny-webapp&redirect_uri=https://erp.tiny.com.br/login&scope=openid&response_type=code', { waitUntil: 'networkidle' });

        await page.fill('#username', username);
        await page.click('//button[contains(text(),"Avançar")]');

        await page.waitForSelector('#password', { state: 'visible', timeout: 10000 });
        await page.fill('#password', password);

        // clique + espera navegação
        await page.waitForTimeout(2000)

        page.click('//button[contains(text(),"Entrar") or contains(text(),"Login")]')

        // tenta pegar modal se existir
        const loginModalBtn = await page.waitForSelector('//div[@class="modal-footer"]//button[contains(text(),"login")]', { timeout: 5000 }).catch(() => null);

        if (loginModalBtn) {
            await loginModalBtn.click()
            await page.waitForTimeout(2000)
        }

        const cookies = await context.cookies();
        const tinySession = cookies.find(c => c.name === 'TINYSESSID')?.value
        const csrfToken = cookies.find(c => c.name === '_csrf_token')?.value

        return {
            tinySession,
            csrfToken
        }

    } catch (err) {
        console.log(err.message)
        throw new Error(err.message)
    } finally {
        await browser.close()
    }

}

export async function categories({search = ' '}) {
  try {

    const session = await getServerSession(authOptions)
    
    const options = await authentication({})

    if (options) {

      const args = `[{"queryKey":["conta.pagar.categorias.financeiras"],"signal":{"aborted":false,"onabort":null}}]`
      const data = `argsLength=${_.size(args)}&args=${encodeURIComponent(args)}`

      await rateLimitedFetch();

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

      const db = new AppContext()
    
      await db.transaction(async (transaction) => {
        for (const item of retornoUnico) {

          const externalId = String(item.id)

          await db.FinancialCategory.findOrCreate({
            where: { externalId },
            defaults: {
              companyBusinessId: session.company.companyBusiness.codigo_empresa,
              companyId: session.company.codigo_empresa_filial,
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

export async function partners({ search = " " }) {
  try {
    
    if (!search) search = " "

    const session = await getServerSession(authOptions)
    const db = new AppContext()

    const companyIntegration = await db.CompanyIntegration.findOne({
      attributes: ["id", "options"],
      where: [
        { companyId: session.company.codigo_empresa_filial },
        { integrationId: "E6F39F15-5446-42A7-9AC4-A9A99E604F07" },
      ],
    })

    let options = await authentication({})

    const lastSyncPartner = new Date()

    await db.transaction(async (transaction) => {

      let page = 1
      let totalPages = 1

      do {

        const params = {
          token: options.token,
          formato: "json",
          pesquisa: search,
          pagina: page,
          dataMinimaAtualizacao: options?.lastSyncPartner ? format(options?.lastSyncPartner, "dd/MM/yyyy HH:mm:ss") : null,
        }

        const query = Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join("&");

        const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?${query}`;

        console.log(`🔹 [${page}/${page}] Buscando página de contatos`)

        await rateLimitedFetch();

        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const r = await res.json();

        // Nenhum registro retornado
        if (r?.retorno?.codigo_erro === '20') break;

        if (r?.retorno?.status === "Erro") throw new Error(r?.retorno?.erros[0]?.erro);

        totalPages = Number(r.retorno.numero_paginas) || 1;

        const externalIdsFromApi = _.map(r.retorno.contatos, (item) => _.get(item, "contato.id"));

        // Buscar parceiros existentes
        const existingPartners = await db.Partner.findAll({
          where: { externalId: externalIdsFromApi },
          transaction,
          attributes: ["codigo_pessoa", "externalId"],
        });

        const existingExternalIds = existingPartners.map((p) => p.externalId);

        // 🔹 Novos parceiros
        const newPartners = _(r.retorno.contatos)
          .filter((item) => !_.includes(existingExternalIds, _.get(item, "contato.id")))
          .map((item) => ({
            companyId: session.company.codigo_empresa_filial,
            externalId: _.get(item, "contato.id"),
            surname: String(_.get(item, "contato.nome")),
            cpfCnpj: String(_.get(item, "contato.cpf_cnpj", "")).replace(/\D/g, ""),
            isActive: _.get(item, "contato.situacao") === "Ativo" ? 1 : 0,
          }))
          .value();

        if (newPartners.length > 0) {
          await db.Partner.bulkCreate(newPartners, { transaction });
        }

        // 🔹 Atualizar parceiros existentes
        for (const partner of r.retorno.contatos) {
          const existing = existingPartners.find(
            (p) => p.externalId === _.get(partner, "contato.id")
          );
          if (existing) {
            await db.Partner.update(
              {
                surname: String(_.get(partner, "contato.nome")),
                cpfCnpj: String(_.get(partner, "contato.cpf_cnpj", "")).replace(/\D/g, ""),
                isActive: _.get(partner, "contato.situacao") === "Ativo" ? 1 : 0,
              },
              { where: { codigo_pessoa: existing.codigo_pessoa }, transaction }
            )
          }
        }

        page++;

      } while (page <= totalPages)

      // Atualizar última sincronização
      options.lastSyncPartner = format(lastSyncPartner, "yyyy-MM-dd HH:mm")

      await db.CompanyIntegration.update(
        { options: JSON.stringify(options) },
        { where: [{ id: companyIntegration.id }], transaction }
      )

    })

    console.log("✅ Sincronização de contatos concluída")

  } catch (error) {
    console.error("Erro em getTinyPartner:", error.message)
    throw error
  }
}

// =============================
// 🔹 AUXILIARES GENÉRICOS
// =============================
// Buscar páginas de contas
async function fetchTinyAccounts({ token, partner, start, end, offset, type }) {

  const params = new URLSearchParams({ token, formato: "json" })

  if (partner !== undefined) params.append("nome_cliente", partner.surname)
  if (start !== undefined) params.append("data_ini_vencimento", start)
  if (end !== undefined) params.append("data_fim_vencimento", end)
  if (offset !== undefined) params.append("pagina", offset)

  const endpoint =
    type === "pay"
      ? "contas.pagar.pesquisa.php"
      : "contas.receber.pesquisa.php"

  const url = `https://api.tiny.com.br/api2/${endpoint}?${params.toString()}`

  await rateLimitedFetch()

  const res = await fetch(url)

  if (!res.ok) throw new Error(`Erro ao acessar ${url}: ${res.statusText}`)

  return res.json()

}

// Buscar detalhes de cada conta
async function fetchTinyDetail({ token, id, type }) {
  const endpoint =
    type === "pay"
      ? "conta.pagar.obter.php"
      : "conta.receber.obter.php";

  const url = `https://api.tiny.com.br/api2/${endpoint}?token=${token}&id=${id}&formato=json`;

  await rateLimitedFetch();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao acessar ${url}: ${res.statusText}`);

  return res.json();
}

// Obter todas as páginas e detalhes
async function getAllTinyAccounts({ token, partner, start, end, type }) {

  let page = 1
  let totalPages = 1
  let contas = []

  console.log("🔹 Iniciando busca de contas...")

  // 🔁 Buscar todas as páginas
  do {

    const response = await fetchTinyAccounts({
      token,
      partner,
      start,
      end,
      offset: page,
      type,
    })

    const contasDaPagina = response?.retorno?.contas || []

    contas.push(...contasDaPagina)

    if (page === 1) {

      totalPages = Number(response?.retorno?.numero_paginas) || 1

      if (totalPages > 1) {
        console.log(`🔹 Encontradas ${totalPages} páginas de contas...`)
      }

    }

    page++

  } while (page <= totalPages)

  console.log(`✅ Total de contas encontradas: ${contas.length}`)

  // 🔍 Buscar detalhes de cada conta
  const contasComDetalhe = []
  let index = 0

  do {

    const conta = contas[index]

    const id = conta?.conta?.id

    if (!id) {
      index++
      continue
    }

    console.log(`🔹 [${index + 1}/${contas.length}] Buscando detalhe da conta ${id}`)

    try {

      const detail = await fetchTinyDetail({ token, id, type })
      contasComDetalhe.push({ ...conta, detail: detail?.retorno || {} })

    } catch (err) {
      console.error(`❌ Erro ao buscar detalhe da conta ${id}:`, err.message)
    }

    index++

  } while (index < contas.length)

  console.log(`✅ Detalhes obtidos para ${contasComDetalhe.length} contas`)

  return contasComDetalhe

}

// Montar dados de parceiro (clientes/fornecedores)
function extractPartners(contasComDetalhe) {
  return _.uniqBy(
    contasComDetalhe
      .map((item) => {
        const cpfCnpj = String(_.get(item, "detail.conta.cliente.cpf_cnpj", "")).replace(/\D/g, "");
        const nome = _.get(item, "conta.nome_cliente", "").trim();
        return { cpfCnpj: cpfCnpj || null, nome: nome || null };
      })
      .filter((p) => p.cpfCnpj || p.nome),
    (p) => p.cpfCnpj || p.nome
  )
}

// Montar lista de movimentos financeiros
function buildMovements(contasComDetalhe, partnerMap) {

  return contasComDetalhe.map((item) => {

    const id = item.conta.id
    const detail = item.detail
    const nro_documento = detail?.conta?.nro_documento?.split("/") || []

    const cpfCnpj = String(_.get(detail, "conta.cliente.cpf_cnpj", "")).replace(/\D/g, "")
    const surname = _.get(detail, "conta.cliente.nome", "").trim()

    const partner =
      partnerMap.get(cpfCnpj) ||
      partnerMap.get(surname.toLowerCase())

    return {
      externalId: id,
      documentNumber: Number(nro_documento[0] || id),
      partnerId: partner?.codigo_pessoa || null,
      category: detail?.conta?.categoria || null,
      amount: item.conta.valor,
      issueDate: format(parse(item.conta.data_emissao, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
      dueDate: format(parse(item.conta.data_vencimento, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
      observation: item.conta.historico,
    }

  })

}

// Atualizar/criar movimentos e parcelas
async function upsertMovements({
  db,
  transaction,
  allPayments,
  session,
  type_operation, // 1 = receber, 2 = pagar
}) {
  const existingMovements = await db.FinancialMovementInstallment.findAll({
    include: [
      {
        model: db.FinancialMovement,
        as: "financialMovement",
        attributes: ["partnerId", "documentNumber", "amount", "issueDate", "observation"],
      },
    ],
    where: { externalId: allPayments.map((p) => p.externalId) },
    transaction,
  })

  const existingMap = new Map(existingMovements.map((m) => [m.externalId, m]))
  const toCreate = []
  const toUpdate = []

  for (const item of allPayments) {

    const existing = existingMap.get(item.externalId)

    const category = item.category
      ? await db.FinancialCategory.findOne({
          attributes: ["id"],
          where: [{ Descricao: item.category }],
          transaction,
        })
      : null

    const categoryId = category?.id || null;

    if (!existing) {
      toCreate.push({
        ...item,
        companyId: session.company.codigo_empresa_filial,
        type_operation,
        categoryId,
      })
    } else {

      const updatedFields = {
        documentNumber: item.documentNumber,
        partnerId: item.partnerId,
        categoryId,
        amount: item.amount,
        issueDate: item.issueDate,
        dueDate: item.dueDate,
        observation: item.observation,
      }

      const hasChanges = Object.keys(updatedFields).some(
        (key) => String(existing[key]) !== String(updatedFields[key])
      )

      if (hasChanges) {
        toUpdate.push({ id: existing.financialMovementId, ...updatedFields });
      }
    }
  }

  // Criar novos movimentos
  const createdMovements = await db.FinancialMovement.bulkCreate(toCreate, {
    transaction,
    returning: true,
  })

  // Atualizar existentes
  for (const updateData of toUpdate) {

    await db.FinancialMovement.update(updateData, {
      where: { codigo_movimento: updateData.id },
      transaction,
    })

    await db.FinancialMovementInstallment.update(
      {
        amount: updateData.amount,
        dueDate: updateData.dueDate,
        observation: updateData.observation,
      },
      { where: { codigo_movimento: updateData.id }, transaction }
    )
  }

  // Criar ou atualizar parcelas
  const documentNumberMap = new Map(
    toCreate.map((m) => [m.documentNumber, { externalId: m.externalId, dueDate: m.dueDate }])
  )

  for (const movement of createdMovements) {
    if (!movement) continue;

    const { dueDate, externalId } =
      documentNumberMap.get(movement.documentNumber) || {};

    const [installment, created] =
      await db.FinancialMovementInstallment.findOrCreate({
        where: {
          financialMovementId: movement.codigo_movimento,
          installment: 1,
        },
        defaults: {
          issueDate: movement.issueDate,
          dueDate,
          amount: movement.amount,
          observation: movement.observation,
          externalId,
        },
        transaction,
      })

    if (!created) {
      await installment.update({ dueDate }, { transaction })
    }
  }
}

// =============================
// 🔹 Função principal genérica
// =============================
async function syncTinyData({ partner, start, end, type, type_operation }) {

  const options = await authentication({})

  if (!options) return

  await categories({})
  await partners({})

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const contasComDetalhe = await getAllTinyAccounts({
    token: options.token,
    partner,
    start,
    end,
    type,
  })

  await db.transaction(async (transaction) => {

    const partnerData = extractPartners(contasComDetalhe)

    const existingPartners = await db.Partner.findAll({
      where: {
        companyId: session.company.codigo_empresa_filial,
        [Op.or]: [
          { cpfCnpj: partnerData.map((p) => p.cpfCnpj).filter(Boolean) },
          { nome: partnerData.map((p) => p.nome).filter(Boolean) },
        ],
      },
      transaction,
    })

    const partnerMap = new Map();
    for (const p of existingPartners) {
      if (p.cpfCnpj) partnerMap.set(p.cpfCnpj, p);
      if (p.surname) partnerMap.set(p.surname.trim().toLowerCase(), p);
    }

    const allPayments = buildMovements(contasComDetalhe, partnerMap);

    await upsertMovements({
      db,
      transaction,
      allPayments,
      session,
      type_operation,
    })

  })

  console.log(`✅ Sincronização Tiny (${type}) concluída com sucesso.`)

}

// =============================
// 🔹 FUNÇÕES PRINCIPAIS
// =============================
export async function payments({ partner, start, end }) {
  await syncTinyData({ partner, start, end, type: "pay", type_operation: 2 });
}

export async function receivements({ partner, start, end }) {
  await syncTinyData({ partner, start, end, type: "receive", type_operation: 1 });
}

export async function transfer({date, originId, destinationId, amount, observation = ''}) {

  const options = await authentication({})

  const args = `[{"data":"${format(date, 'dd/MM/yyyy')}","valor":"${amount.toString().replace('.', ',')}","idContaOrigem":"${originId}","idContaDestino":"${destinationId}","historicoTransferencia":"${observation}"}]`

  const data = `argsLength=${args.length}&args=${args}`

  await rateLimitedFetch();

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
      "cookie": `TINYSESSID=${options.TINYSESSID};_csrf_token=${options._csrf_token}`,
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