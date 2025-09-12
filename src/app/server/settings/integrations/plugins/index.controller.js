"use server"

import { AppContext } from "@/database";
import { format, fromZonedTime } from "date-fns-tz";
import csv from 'csvtojson';
import { addDays } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import _ from "lodash";
import fs from "fs";

export async function authorization({companyIntegrationId}) {

    const db = new AppContext()

    const companyIntegration = await db.CompanyIntegration.findOne({
        attributes: ['id', 'options'],
        where: [{id: companyIntegrationId}]
    })

    let options = JSON.parse(companyIntegration.options)

    const params = new URLSearchParams();

    params.append('grant_type', 'refresh_token')
    params.append('client_id', '4404783242240588')
    params.append('client_secret', 'XZKpfqhCIQjvnLk9DnRA4f7UHOs3OC5c')
    params.append('refresh_token', options.refresh_token)

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

    await db.CompanyIntegration.update({options: JSON.stringify({refresh_token: token.refresh_token})}, {where: [{id: companyIntegration.dataValues.id}]})

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

export async function getStatement({companyIntegrationId, item}) {

    console.log(item)

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

    const json = await csv({ delimiter: ";" }).fromString(csvText);

    //const jsonData = JSON.stringify(json, null, 2)

    const statements = []

    //const orders1 = await orders({companyIntegrationId: companyIntegrationId, start: format(addDays(new Date(item.begin), -15), "yyyy-MM-dd"), end: format(addDays(new Date(item.end), 15), "yyyy-MM-dd")})

    //fs.writeFileSync(`C:\\Arquivos\\${item.fileName}.json`, JSON.stringify(orders1, null, 2), "utf-8");

    //console.log(orders1)

    for (let item of json) {

        //const pack_id = orders1.filter((c) => c.id.toString() == item.ORDER_ID.toString())[0]?.pack_id

        if (item.ORDER_ID) {
            
            const order = await findOne({access_token: token.access_token, orderId: item.ORDER_ID})

            const result = order.results[0]
            
            if (result.pack_id != null) {
                item.ORDER_ID = result.pack_id
            }

            //fs.writeFileSync(`C:\\Arquivos\\order-${item.ORDER_ID}.json`, JSON.stringify(order, null, 2), "utf-8");

            item.DESCRIPTION = result.status

        }
        
        let statementData = {}
         
        statementData.entryDate = item.DATE ? format(new Date(item.DATE), 'yyyy-MM-dd HH:mm:ss') : null
        statementData.entryType = item.DESCRIPTION
        statementData.sourceId = item.SOURCE_ID?.toString()
        statementData.reference = item.ORDER_ID?.toString()
        statementData.amount = parseFloat(item.GROSS_AMOUNT)
        statementData.fee = parseFloat(item.MP_FEE_AMOUNT)
        //statementData.coupon = parseFloat(item.COUPON_AMOUNT);
        statementData.shipping = parseFloat(item.SHIPPING_FEE_AMOUNT)
        statementData.debit = parseFloat(item.NET_DEBIT_AMOUNT) * -1
        statementData.credit = parseFloat(item.NET_CREDIT_AMOUNT)
        statementData.balance = parseFloat(item.BALANCE_AMOUNT)

        statements.push(statementData)

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