"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { format, parse } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"

// 🔹 Controle de taxa Tiny API
const MAX_REQUESTS_PER_SECOND = 1; // Ajuste conforme seu plano Tiny
const DELAY_MS = 1000 / MAX_REQUESTS_PER_SECOND;
let lastCallTime = 0;

async function rateLimitedFetch() {
  const now = Date.now();
  const elapsed = now - lastCallTime;

  if (elapsed < DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS - elapsed));
  }

  lastCallTime = Date.now();

}

export async function getTinyPartner(search = " ") {
  try {

    const session = await getServerSession(authOptions);
    const db = new AppContext();

    const companyIntegration = await db.CompanyIntegration.findOne({
      attributes: ["options"],
      where: [
        {
          integrationId: "E6F39F15-5446-42A7-9AC4-A9A99E604F07",
          companyId: session.company.codigo_empresa_filial,
        },
      ],
    });

    if (!companyIntegration) return;

    const options = JSON.parse(companyIntegration.options);

    let page = 1;
    let totalPages = 1;

    do {
      
      const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${options.token}&formato=json&pesquisa=${encodeURIComponent(search)}&pagina=${page}`;

      console.log(`🔹 Buscando página ${page} de contatos`);

      await rateLimitedFetch();

      const res = await fetch(url, options);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const r = await res.json();
      
      if (r?.retorno.status === "Erro") {
        throw new Error(r.retorno.erros[0].erro);
      }

      totalPages = Number(r.retorno.numero_paginas) || 1;

      await db.transaction(async (transaction) => {
        const externalIdsFromApi = _.map(
          r.retorno.contatos,
          (item) => _.get(item, "contato.id")
        );

        const existingPartners = await db.Partner.findAll({
          where: { externalId: externalIdsFromApi },
          transaction,
          attributes: ["externalId"],
        });

        const existingExternalIds = existingPartners.map((p) => p.externalId);

        const newPartners = _(r.retorno.contatos)
          .filter((item) => !_.includes(existingExternalIds, _.get(item, "contato.id")))
          .map((item) => ({
            companyId: session.company.codigo_empresa_filial,
            externalId: _.get(item, "contato.id"),
            surname: String(_.get(item, "contato.nome")),
            cpfCnpj: String(_.get(item, "contato.cpf_cnpj", "")).replace(/\D/g, ""),
            isActive: _.get(item, "contato.situacao") == 'Ativo' ? 1 : 0
          }))
          .value();

        if (newPartners.length > 0) {
          await db.Partner.bulkCreate(newPartners, { transaction });
        }
      });

      page++;
    } while (page <= totalPages);

    console.log("✅ Sincronização de parceiros concluída");
  } catch (error) {
    console.error("Erro em getTinyPartner:", error.message);
    throw error
  }
}

export async function getTinyCategories(search = ' ') {
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
            amount: item.conta.valor,
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
              amount: payment.amount,
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
  //await getTinyPartner()

  const session = await getServerSession(authOptions)

  const db = new AppContext();

  const companyIntegration = await db.CompanyIntegration.findOne({
    attributes: ["options"],
    where: [
      {
        integrationId: "E6F39F15-5446-42A7-9AC4-A9A99E604F07",
        companyId: session.company.codigo_empresa_filial,
      },
    ],
  });

  if (!companyIntegration) return;

  const options = JSON.parse(companyIntegration.dataValues.options);

  // Função auxiliar para paginação da API Tiny
  const receivements = async ({ token, start, end, offset }) => {
    console.log(start, end)
    const url = `https://api.tiny.com.br/api2/contas.receber.pesquisa.php?token=${token}&formato=json&data_ini_vencimento=${start}&data_fim_vencimento=${end}&pagina=${offset}`;
    await rateLimitedFetch();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ao acessar ${url}: ${res.statusText}`);
    return res.json();
  };

  // Função auxiliar para detalhes das contas
  const receivementDetails = async ({ token, id }) => {
    const url = `https://api.tiny.com.br/api2/conta.receber.obter.php?token=${token}&id=${id}&formato=json`;
    await rateLimitedFetch();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ao acessar ${url}: ${res.statusText}`);
    return res.json();
  };

  // 🔹 1. Buscar todas as contas
  const firstPage = await receivements({
    token: options.token,
    start,
    end,
    offset: 1,
  });

  const totalPages = Number(firstPage?.retorno?.numero_paginas) || 1;

  let contas = [...(firstPage?.retorno?.contas || [])];

  if (totalPages > 1) {
    console.log(`🔹 Buscando ${totalPages} páginas de contas...`);
    for (let i = 2; i <= totalPages; i++) {
      const response = await receivements({
        token: options.token,
        start,
        end,
        offset: i,
      });
      contas.push(...(response?.retorno?.contas || []));
    }
  }

  console.log(`✅ Total de contas encontradas: ${contas.length}`);

  // 🔹 2. Buscar detalhes (com controle de taxa)
  const contasComDetalhe = [];

  for (let i = 0; i < contas.length; i++) {
    const item = contas[i];
    const id = item.conta.id;

    console.log(`🔹 [${i + 1}/${contas.length}] Buscando detalhe da conta ${id}`);

    try {
      const detail = await receivementDetails({
        token: options.token,
        id,
      });

      contasComDetalhe.push({
        ...item,
        detail: detail?.retorno || {},
      });
    } catch (err) {
      console.error(`❌ Erro ao buscar detalhe da conta ${id}:`, err.message);
    }
  }

  console.log(`✅ Detalhes obtidos para ${contasComDetalhe.length} contas`);

  // 🔹 3. Início da transação no banco
  await db.transaction(async (transaction) => {
    // 🔹 Garantir que os parceiros existem
    const partnerData = _.uniqBy(
      contasComDetalhe
        .map((item) => ({
          cpfCnpj: String(_.get(item, "detail.conta.cliente.cpf_cnpj", "")).replace(/\D/g, ""),
        }))
        .filter((p) => p.cpfCnpj),
      "cpfCnpj"
    );

    const existingPartners = await db.Partner.findAll({
      where: { cpfCnpj: partnerData.map((p) => p.cpfCnpj) },
      transaction,
    });

    const partnerMap = new Map(existingPartners.map((p) => [p.cpfCnpj, p]));

    // 🔹 4. Montar lista completa de pagamentos
    const allPayments = contasComDetalhe.map((item) => {
      const id = item.conta.id;
      const detail = item.detail;
      const nro_documento = detail.conta?.nro_documento?.split("/") || [];
      const partner = partnerMap.get(
        String(_.get(detail, "conta.cliente.cpf_cnpj", "")).replace(/\D/g, "")
      );

      return {
        externalId: id,
        documentNumber: Number(nro_documento[0]),
        amount: item.conta.valor,
        issueDate: format(parse(item.conta.data_emissao, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
        dueDate: format(parse(item.conta.data_vencimento, "dd/MM/yyyy", new Date()), "yyyy-MM-dd"),
        observation: item.conta.historico,
        partnerId: partner?.codigo_pessoa || null,
        category: detail.categoria || null,
      };
    });

    // 🔹 5. Buscar movimentos existentes
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
    });

    const existingMap = new Map(existingMovements.map((m) => [m.externalId, m]));
    
    const toCreate = [];
    const toUpdate = [];

    for (const receivement of allPayments) {
      const existing = existingMap.get(receivement.externalId);

      const category = receivement.category
        ? await db.FinancialCategory.findOne({
            attributes: ["id"],
            where: [{ Descricao: receivement.category }],
            transaction,
          })
        : null;

      const categoryId = category?.dataValues.id || null;

      if (!existing) {
        
        toCreate.push({
          ...receivement,
          type_operation: 1,
          companyId: session.company.codigo_empresa_filial,
          categoryId,
        });

      } else {

        const updatedFields = {
          documentNumber: receivement.documentNumber,
          amount: receivement.amount,
          issueDate: receivement.issueDate,
          dueDate: receivement.dueDate,
          observation: receivement.observation,
          partnerId: receivement.partnerId,
          categoryId,
        };

        const hasChanges = Object.keys(updatedFields).some(
          (key) => String(existing[key]) !== String(updatedFields[key])
        );

        if (hasChanges) {
          toUpdate.push({
            id: existing.financialMovementId,
            ...updatedFields,
          });
        }
      }
    }

    // 🔹 6. Criar novos movimentos
    const createdMovements = await db.FinancialMovement.bulkCreate(toCreate, {
      transaction,
      returning: true,
    });

    // 🔹 6.1. Mapear documentNumber -> dueDate, externalId
    const documentNumberMap = new Map(toCreate.map((m) => [m.documentNumber, { externalId: m.externalId, dueDate: m.dueDate }]));

    // 🔹 7. Atualizar existentes
    for (const updateData of toUpdate) {
      await db.FinancialMovement.update(updateData, {
        where: { codigo_movimento: updateData.id },
        transaction,
      });
    }

    // 🔹 8. Criar ou atualizar parcelas
    for (const movement of createdMovements) {

      if (!movement) continue;

      const { dueDate, externalId } = documentNumberMap.get(movement.documentNumber) || {};

      const [installment, created] = await db.FinancialMovementInstallment.findOrCreate({
        where: { financialMovementId: movement.codigo_movimento, installment: 1 },
        defaults: {
          issueDate: movement.issueDate,
          dueDate: dueDate,
          amount: movement.amount,
          observation: movement.observation,
          externalId: externalId,
        },
        transaction,
      });

      if (!created) {
        await installment.update(
          { dueDate },
          { transaction }
        );
      }
    }
  });

  console.log("✅ Sincronização Tiny concluída com sucesso.");
}
