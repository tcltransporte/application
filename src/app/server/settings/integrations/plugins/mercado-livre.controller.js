"use server"

import { AppContext } from "@/database";
import { format, fromZonedTime } from "date-fns-tz";
import csv from 'csvtojson';
import { addDays, parse } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import _ from "lodash";
import fs from "fs";

export async function authorization({companyIntegrationId}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const companyIntegration = await db.CompanyIntegration.findOne({
        attributes: ['id', 'options'],
        where: [
            {companyId: session.company.codigo_empresa_filial},
            {integrationId: '420E434C-CF7D-4834-B8A6-43F5D04E462A'},
        ]
    })

    let options = JSON.parse(companyIntegration.options)

    const params = new URLSearchParams();

    params.append('grant_type', 'refresh_token')
    params.append('client_id', '4404783242240588')
    params.append('client_secret', 'XZKpfqhCIQjvnLk9DnRA4f7UHOs3OC5c')
    params.append('refresh_token', options.refresh_token)

    console.log(options.refresh_token)

    const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    })

    const token = await response.json()

    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`)
    }

    await db.CompanyIntegration.update({options: JSON.stringify({refresh_token: token.refresh_token})}, {where: [{id: companyIntegration.id}]})

    return token

}

export async function getStatements({companyIntegrationId}) {

    const db = new AppContext()

    
    const session = await getServerSession(authOptions)
    

    const ids = await db.Statement.findAll({attributes: ['sourceId'], where: [{'$companyId$': session.company.codigo_empresa_filial}]})

    const sourceIds = _.map(ids, (item) => Number(item.sourceId))
    

    const token = await authorization({companyIntegrationId})

    const response = await fetch('https://api.mercadopago.com/v1/account/release_report/list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token.access_token}`,
        },
    })

    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
    }

    const data = await response.json()

    const statement = []

    console.log(sourceIds)

    const filteredData = data.filter((item) => !sourceIds.includes(item.id))

    for (const item of filteredData) {
        console.log(item)
        statement.push({
            sourceId: item.id,
            fileName: item.file_name,
            begin: item.begin_date,
            end: item.end_date
        })
    }

    return statement   

}

function isEmptyJsonString(str) {
  try {
    const parsed = JSON.parse(str)
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length === 0
    )
  } catch {
    return false
  }
}

export async function statement({companyIntegrationId, item, file}) {

    const csvContent = await file.text()

    // Quebra o CSV em linhas
    const lines = csvContent.split('\n')

    // Remove as 3 primeiras linhas
    const dataLines = lines.slice(3).join('\n')

    // Converte apenas essa parte em JSON
    const accountStatement = await csv({ delimiter: ';' }).fromString(dataLines)

    // Remove o último item (última linha)
    //accountStatement.pop()

    //console.log(accountStatement)

    
    const token = await authorization({companyIntegrationId})

    const response = await fetch(`https://api.mercadopago.com/v1/account/release_report/${item.fileName}`, {
        method: 'GET',
        headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.access_token}`
            }
        }
    )

    if (!response.ok) {
        throw new Error(`Erro ao buscar CSV: ${response.statusText}`)
    }

    const csvText = await response.text()

    //const base64 = btoa(new TextEncoder().encode(csvText).reduce((data, byte) => data + String.fromCharCode(byte), ''))

    //return base64

    let json = await csv({ delimiter: "," }).fromString(csvText);

    // Ordena antes do for
    /*json = _.orderBy(
        json,
        [
            (item) => item.DATE ? new Date(item.DATE) : new Date(0), // primeiro por data
            (item) => item.ORDER_ID?.toString() || ""               // depois por referência
        ],
        ["asc", "asc"] // ordem crescente para ambos
    )*/

    const statements = []

    let sequence = 1

    for (let item of accountStatement) {

        //console.log(item)


        let reference

        if (isEmptyJsonString(item)) {
            continue
        }

        const liberations = _.filter(json, (c) => c.SOURCE_ID == item.REFERENCE_ID)

        console.log(liberations)

        let liberation = liberations[0]

        if (liberation?.DESCRIPTION == 'payment') {
            liberation.DESCRIPTION = 'receivement'
        }

        if (_.size(_.filter(liberations, (c) => c.DESCRIPTION == 'mediation')) > 0) {
            liberation.DESCRIPTION = 'mediation'
        }

        console.log(liberation)

        reference = liberation?.ORDER_ID?.toString()

        if (!_.isEmpty(liberation?.PACK_ID)) {
            reference = liberation?.PACK_ID
        }

        //console.log(item)

        //console.log('sourceId: ', item.DEBITS, liberation)

        /*
        if (Number(item.NET_DEBIT_AMOUNT) == 0 && Number(item.NET_CREDIT_AMOUNT) == 0) {
            continue
        }

        if (_.isEmpty(item.SOURCE_ID)) {
            continue
        }

        if (item.DESCRIPTION == 'reserve_for_debt_payment') {
            continue
        }

        if (item.DESCRIPTION == 'reserve_for_payout') {
            continue
        }

        if (item.ORDER_ID) {
            
            const order = await findOne({access_token: token.access_token, orderId: item.ORDER_ID})

            const result = order.results[0]
            
            if (result.pack_id != null) {
                item.ORDER_ID = result.pack_id
            }

            item.DESCRIPTION = result.status

        }*/
        
        //console.log(item)

        //console.log(liberation?.DATE, item.RELEASE_DATE)

        let statementData = {}

        const entryDate = liberation?.DATE || item.RELEASE_DATE
        const amount = parseFloat(item?.TRANSACTION_NET_AMOUNT.replace(/\./g, '').replace(',', '.'))

        statementData.sequence = sequence
        statementData.entryDate = entryDate ? format(liberation?.DATE ? new Date(entryDate) : parse(entryDate, 'dd-MM-yyyy', new Date()), 'yyyy-MM-dd HH:mm:ss') : null
        statementData.entryType = liberation?.DESCRIPTION
        statementData.sourceId = item.REFERENCE_ID
        statementData.reference = reference
        statementData.description = item.TRANSACTION_TYPE
        statementData.amount = parseFloat(liberation?.GROSS_AMOUNT ?? 0) ?? amount
        statementData.fee = parseFloat(liberation?.MP_FEE_AMOUNT ?? 0)
        statementData.shipping = parseFloat(liberation?.SHIPPING_FEE_AMOUNT ?? 0)
        statementData.extra = JSON.stringify(liberations)

        if (amount < 0) {
            statementData.debit = amount
            statementData.credit = 0
        }

        if (amount > 0) {
            statementData.debit = 0
            statementData.credit = amount
        }
        
        statementData.balance = parseFloat(item.PARTIAL_BALANCE?.replace(/\./g, '').replace(',', '.'))

        statements.push(statementData)

        sequence++

    }

    return statements

}

export async function addStatement({companyIntegrationId, date}) {
    try {

        const token = await authorization({companyIntegrationId})

        const data = {
            begin_date: format(addDays(date, 2), "yyyy-MM-dd'T'00:00:00'Z'"),
            end_date: format(addDays(date, 2), "yyyy-MM-dd'T'00:00:00'Z'")
        }

        const response = await fetch("https://api.mercadopago.com/v1/account/release_report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token.access_token}`
            },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error(`Erro: ${response.status} - ${response.statusText}`)
        }

    } catch (error) {
        throw new Error(error.message)
    }
}

export async function orders({companyIntegrationId, start, end}) {

    const token = await authorization({companyIntegrationId})

    const result = await mercadolivre_orders({start, end, access_token: token.access_token, offset: 0});

    const pages = Math.ceil((result.paging.total) / result.paging.limit || 1);

    var orders = [...result.results];

    for (var i = 1; i < pages; i++) {
        const proxPagina = await mercadolivre_orders({start, end, access_token: token.access_token, offset: i});
        for (var item of proxPagina.results) {
            orders.push(item);
        }
    }

    return orders;

}

async function mercadolivre_orders({access_token, start, end, offset}) {

    const r = await fetch(
        `https://api.mercadolibre.com/orders/search?seller=2484487707&offset=${offset * 50}&limit=50&order.date_last_updated.from=${start}T00:00:00.000-04:00&order.date_last_updated.to=${end}T23:59:59.999-04:00`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
        }
    );

    if (!r.ok) {
        throw new Error(`Erro na requisição: ${r.status} ${r.statusText}`);
    }

    const data = await r.json();
    
    return data;

}

async function findOne({access_token, orderId}) {

    const r = await fetch(
        `https://api.mercadolibre.com/orders/search?seller=2484487707&q=${orderId}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`,
            },
        }
    );

    if (!r.ok) {
        throw new Error(`Erro na requisição: ${r.status} ${r.statusText}`);
    }

    const data = await r.json();
    
    return data;

}