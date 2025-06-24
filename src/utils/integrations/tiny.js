"use server"

import { AppContext } from "@/database";
import { format, parse } from "date-fns";
import _ from "lodash";

export async function getTinyPartner(search) {

    const db = new AppContext();

    await db.transaction(async (transaction) => {

        const token = '23a552cec9aa74bb452efbc9f56c63d4e8dc72ec1377d41bca32f2e4b58cc871';
        const url = `https://api.tiny.com.br/api2/contatos.pesquisa.php?token=${token}&formato=json&pesquisa=${search}`;

        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const r = await response.json();

        const externalIdsFromApi = r.retorno.contatos.map((item) => item.contato.id);
    
        const existingPartners = await db.Partner.findAll({
          where: {
            externalId: externalIdsFromApi,
          },
          transaction,
          attributes: ['externalId'],
        });
    
        const existingExternalIds = existingPartners.map((p) => p.externalId);
    
        const newPartners = r.retorno.contatos
          .filter((item) => !existingExternalIds.includes(item.contato.id))
          .map((item) => ({
            externalId: item.contato.id,
            surname: item.contato.nome,
          }));
    
        if (newPartners.length > 0) {
          await db.Partner.bulkCreate(newPartners, { transaction });
        }
    
    });

}

export async function getTinyCategories(search) {
    
    const db = new AppContext()

    const args = `[{"queryKey":["conta.pagar.categorias.financeiras"],"signal":{"aborted":false,"onabort":null}}]`;
    const data = `argsLength=${_.size(args)}&args=${encodeURIComponent(args)}`;

    const TINYSESSID = '51p4h8fgqi86l6cb24n80780lmthcat7'
    const _csrf_token = 'f363047f47d5d7586d93a8a18bf55c8d3f4998b7b6742d28f33de02a8eae3358.1749495601%21710873153%211f461e6f1aba32205229933608aaf6072212a6ffb8788ddc6649ee8b7566f60d'

    const response = await fetch(
        'https://erp.tiny.com.br/services/contas.pagar.server/2/CategoriaFinanceira%5CCategoriaFinanceira/obterOpcoesSelectCategorias',
        {
            method: 'POST',
        headers: {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'cookie': `TINYSESSID=${TINYSESSID}; _csrf_token=${_csrf_token}`,
            'origin': 'https://erp.tiny.com.br',
            'referer': 'https://erp.tiny.com.br/caixa',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
            'x-custom-request-for': 'XAJAX',
            'x-requested-with': 'XMLHttpRequest',
            'x-user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
        },
            body: data
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseJson = await response.json();

    const retorno = _.flatMap(responseJson.response[0].val, (item) => item.categorias)

    const externalIdsFromApi = retorno.map((item) => item.id);

    await db.transaction(async (transaction) => {

        const existingFinancialCategories = await db.FinancialCategory.findAll({
            attributes: ['externalId'],
            where: {
                externalId: externalIdsFromApi,
            },
            transaction
        });

        const existingExternalIds = existingFinancialCategories.map((p) => p.externalId)

        const newFinancialCategoryies = retorno
            .filter((item) => !existingExternalIds.includes(item.id))
            .map((item) => ({
            externalId: item.id,
            code: item.id,
            account: item.id,
            description: item.desc,
        }))

        if (newFinancialCategoryies.length > 0) {
            await db.FinancialCategory.bulkCreate(newFinancialCategoryies, { transaction });
        }
    })

}

export async function getTinyPayments({ start, end }) {
  const token = '23a552cec9aa74bb452efbc9f56c63d4e8dc72ec1377d41bca32f2e4b58cc871';

  const payments = async ({ token, start, end, offset }) => {
    const url = `https://api.tiny.com.br/api2/contas.pagar.pesquisa.php?token=${token}&formato=json&data_ini_vencimento=${start}&data_fim_vencimento=${end}&pagina=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ao buscar página ${offset}: ${res.statusText}`);
    return await res.json();
  };

  const firstPage = await payments({ token, start, end, offset: 1 });
  const totalPages = Number(firstPage?.retorno?.numero_paginas) || 1;
  let contas = [...(firstPage?.retorno?.contas || [])];

  if (totalPages > 1) {
    const promises = [];
    for (let i = 2; i <= totalPages; i++) {
      promises.push(payments({ token, start, end, offset: i }));
    }
    const responses = await Promise.all(promises);
    for (const response of responses) {
      contas.push(...(response?.retorno?.contas || []));
    }
  }

  const db = new AppContext();

  await db.transaction(async (transaction) => {
    // 1. Garantir que os parceiros existem
    const partnerNames = _.uniq(contas.map((item) => item.conta.nome_cliente).filter(Boolean));
    const existingPartners = await db.Partner.findAll({
      where: { surname: partnerNames },
      transaction,
    });

    const partnerMap = new Map(existingPartners.map(p => [p.surname, p]));

    for (const name of partnerNames) {
      if (!partnerMap.has(name)) {
        const newPartner = await db.Partner.create({ surname: name }, { transaction });
        partnerMap.set(name, newPartner);
      }
    }

    // 2. Mapear pagamentos
    const allPayments = contas.map((item) => {

        console.log(item)

      const id = item.conta.id;
      const name = item.conta.nome_cliente;
      const partner = partnerMap.get(name);

      return {
        externalId: id,
        documentNumber: id,
        amountTotal: item.conta.valor,
        issueDate: format(parse(item.conta.data_emissao, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
        dueDate: format(parse(item.conta.data_vencimento, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
        description: item.conta.historico,
        partnerId: partner?.codigo_pessoa || null,
      };
    });

    // 3. Buscar movimentos financeiros existentes
    const existingMovements = await db.FinancialMovement.findAll({
      where: {
        externalId: allPayments.map(p => p.externalId),
      },
      transaction,
    });

    const existingMap = new Map(existingMovements.map(m => [m.externalId, m]));

    const toUpdate = [];
    const toCreate = [];

    for (const payment of allPayments) {
      if (existingMap.has(payment.externalId)) {
        const existing = existingMap.get(payment.externalId);
        existing.documentNumber = payment.documentNumber;
        existing.amountTotal = payment.amountTotal;
        existing.issueDate = payment.issueDate;
        existing.dueDate = payment.dueDate;
        existing.partnerId = payment.partnerId;
        existing.description = payment.description;
        toUpdate.push(existing);
      } else {
        toCreate.push(payment);
      }
    }

    for (const m of toUpdate) {
      await m.save({ transaction });
    }

    const createdMovements = await db.FinancialMovement.bulkCreate(toCreate, {
      transaction,
      returning: true,
    });

    const allMovements = [...toUpdate, ...createdMovements];
    const movementMap = new Map(allMovements.map(m => [m.externalId, m]));

    // 4. Upsert das parcelas
    for (const payment of allPayments) {
      const movement = movementMap.get(payment.externalId);

      const [installment, created] = await db.FinancialMovementInstallment.findOrCreate({
        where: {
          financialMovementId: movement.codigo_movimento,
          installment: 1,
        },
        defaults: {
          issueDate: payment.issueDate,
          dueDate: payment.dueDate,
          amount: payment.amountTotal,
          description: payment.description,
        },
        transaction,
      });

      if (!created) {
        installment.amount = payment.amountTotal;
        installment.dueDate = payment.dueDate;
        installment.issueDate = payment.issueDate;
        installment.description = payment.description;
        await installment.save({ transaction });
      }
    }
  });

}