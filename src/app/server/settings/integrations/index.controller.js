"use server"

import { AppContext } from "@/database"

import { authOptions } from "@/libs/auth"
import { getTime } from "date-fns"
import _ from "lodash"
import { getServerSession } from "next-auth"

import { chromium } from 'playwright';

export async function getIntegrations() {

  const db = new AppContext()

  let integrations = await db.Integration.findAll()

  return _.map(integrations, (item) => item.get({ plain: true }))

}

export async function getMyIntegrations() {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    let companyIntegration = await db.CompanyIntegration.findAll({
        attributes: ['id', 'options', 'isActive'],
        include: [
            { model: db.Integration, as: 'integration', attributes: ['id', 'name', 'description', 'icon'] }
        ],
        where: [{companyId: session.company.codigo_empresa_filial}]
    })

    return _.map(companyIntegration, (item) => item.get({ plain: true }))

}

export async function onDisconnect({id}) {

    const db = new AppContext()

    await db.CompanyIntegration.destroy({where: [{id}]})

}

export async function onToggleActive({id, isActive}) {

    const db = new AppContext()

    await db.CompanyIntegration.update({isActive}, {where: [{id}]})

}

export async function authentication({companyIntegrationId}) {
    try {

        const db = new AppContext()

        const companyIntegration = await db.CompanyIntegration.findOne({attributes: ['options'], where: [{id: companyIntegrationId}]})

        let options = JSON.parse(companyIntegration.options)

        const timestamp = getTime(new Date())

        const url = `https://erp.tiny.com.br/services/auth.services.php?a=ping&time=${timestamp}`

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
            
            const access = await login({username: '', password: ''})

            options.TINYSESSID = access.tinySession
            options._csrf_token = access.csrfToken

            await db.CompanyIntegration.update({ options: JSON.stringify(options) }, { where: [{ id: companyIntegrationId }] })

            return options

        }

        throw new Error(`Não foi possível conectar ao tiny!`)

    } catch (error) {
        throw error
    }
}

export async function login({username, password}) {
    
    console.log('fazendo login')

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

        await page.fill('#username', 'Integração@11542996000264');
        await page.click('//button[contains(text(),"Avançar")]');

        await page.waitForSelector('#password', { state: 'visible', timeout: 10000 });
        await page.fill('#password', 'Integração@123456');

        // clique + espera navegação
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('//button[contains(text(),"Entrar") or contains(text(),"Login")]')
        ]);

        // tenta pegar modal se existir
        const loginModalBtn = await page.waitForSelector('//div[@class="modal-footer"]//button[contains(text(),"login")]', { timeout: 5000 }).catch(() => null);

        if (loginModalBtn) {
            await loginModalBtn.click()
            await page.waitForTimeout(2000)
        }

        const cookies = await context.cookies();
        const tinySession = cookies.find(c => c.name === 'TINYSESSID')?.value
        const csrfToken = cookies.find(c => c.name === '_csrf_token')?.value

        console.log(tinySession)
        console.log(csrfToken)

        console.log('login feito')

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