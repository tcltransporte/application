"use server"

import { AppContext } from "@/database";
import { format, fromZonedTime } from "date-fns-tz";
import csv from 'csvtojson';

export async function authorization({companyIntegrationId}) {

    const db = new AppContext()

    const companyIntegration = await db.CompanyIntegration.findOne({
        where: [{id: companyIntegrationId}]
    })

    let options = JSON.parse(companyIntegration.dataValues.options)

    const params = new URLSearchParams();

    params.append('grant_type', 'refresh_token')
    params.append('client_id', '1928835050355270')
    params.append('client_secret', 'HS4Bo6e3KHgQF8jpRZvGg7zXjWFv7ybi')
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

    console.log(token)

    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`)
    }

    await db.CompanyIntegration.update({options: JSON.stringify({refresh_token: token.refresh_token})}, {where: [{id: companyIntegration.dataValues.id}]})

    return token

}

export async function getStatements({companyIntegrationId}) {

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

    for (const item of data) {
        statement.push({
            sourceId: item.id,
            fileName: item.file_name,
            begin: item.begin_date,
            end: item.end_date
        })
    }

    return statement   

}

export async function getStatement({companyIntegrationId, fileName}) {

    const token = await authorization({companyIntegrationId})

    const response = await fetch(`https://api.mercadopago.com/v1/account/release_report/${fileName}`, {
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

    const json = await csv().fromString(csvText)

    //const jsonData = JSON.stringify(json, null, 2)

    const statements = []

    for (const item of json) {

        let statementData = {}

        //statementData.id = undefined;
        //statementData.shippingCost = undefined;
        //statementData.statementId = statement2.id;              
        statementData.entryDate = item.DATE ? format(new Date(item.DATE), 'yyyy-MM-dd HH:mm:ss') : null
        statementData.entryType = item.DESCRIPTION
        statementData.sourceId = item.SOURCE_ID?.toString()
        statementData.reference = item.ORDER_ID?.toString()
        statementData.amount = parseFloat(item.GROSS_AMOUNT)
        statementData.fee = parseFloat(item.MP_FEE_AMOUNT)
        //statementData.coupon = parseFloat(item.COUPON_AMOUNT);
        //statementData.fee = parseFloat(item.MP_FEE_AMOUNT);
        //statementData.shipping = parseFloat(item.SHIPPING_FEE_AMOUNT);
        statementData.debit = parseFloat(item.NET_DEBIT_AMOUNT) * -1
        statementData.credit = parseFloat(item.NET_CREDIT_AMOUNT)
        statementData.balance = parseFloat(item.BALANCE_AMOUNT)
        statementData.extra = {
            coupon: parseFloat(item.COUPON_AMOUNT),
            shipping: parseFloat(item.SHIPPING_FEE_AMOUNT)
        }
        //statementData.archive = `{"fileName": "${fileName}", "base64": "${csvText}"}`

        statements.push(statementData)

    }

    return statements

}