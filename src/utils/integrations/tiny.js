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

export async function getTinyPayments({start, end}) {

    const token ='23a552cec9aa74bb452efbc9f56c63d4e8dc72ec1377d41bca32f2e4b58cc871'

    const payments = async ({ token, start, end, offset }) => {

        const url = `https://api.tiny.com.br/api2/contas.pagar.pesquisa.php?token=${token}&formato=json&data_ini_vencimento=${start}&data_fim_vencimento=${end}&pagina=${offset}`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro ao buscar página ${offset}: ${res.statusText}`);
        }

        const data = await res.json();

        return data;

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

    console.log(contas)

    const db = new AppContext()

    await db.transaction(async (transaction) => {

        const externalIdsFromApi = contas.map((item) => item.conta.id);
    
        const existingPayments = await db.FinancialMovement.findAll({
            attributes: ['externalId'],
            where: {
                externalId: externalIdsFromApi,
            },
            transaction,
        });
    
        const existingExternalIds = existingPayments.map((p) => p.externalId);
    
        const newPayments = contas
        .filter((item) => !existingExternalIds.includes(item.conta.id))
        .map((item) => ({
            externalId: item.conta.id,
            documentNumber: item.conta.id,
            amountTotal: item.conta.valor,
            issueDate: format(parse(item.conta.data_emissao, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
            dueDate: format(parse(item.conta.data_vencimento, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'),
            partnerId: 1,
        }));

        if (newPayments.length === 0) return;

        // Cria os movimentos em lote
        const createdMovements = await db.FinancialMovement.bulkCreate(newPayments, {
            transaction,
            returning: true, // necessário para recuperar os IDs gerados
        });

        // Prepara os installments vinculando ao movimento correspondente
        // Combina os dados dos movimentos com os dados originais do `newPayments`
        const installments = createdMovements.map((movement, index) => {
            const original = newPayments[index]; // mantém a ordem
            return {
                financialMovementId: movement.codigo_movimento, // ou `movement.id` se for esse o campo
                externalId: original.externalId,
                documentNumber: original.documentNumber,
                amountTotal: original.amountTotal,
                issueDate: original.issueDate,
                dueDate: original.dueDate,
                partnerId: original.partnerId,
                installment: 1,
                amount: original.amountTotal,
            };
        });

        // Cria os installments em lote
        await db.FinancialMovementInstallment.bulkCreate(installments, { transaction });
    
    });

    return contas;

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