"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"


export async function getCompany() {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const company = await db.Company.findOne({
    attributes: ['codigo_empresa_filial', 'cnpj', 'name', 'surname'],
    where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]
  })

  return company.dataValues

}

export async function setCompanyIntegration({code}) {
  
  const authorization = {
    grant_type: 'authorization_code',
    code,
    client_id: process.env.NEXT_PUBLIC_TINY_CLIENT_ID,
    client_secret: process.env.NEXT_PRIVATE_TINY_CLIENT_SECRET,
    redirect_uri: process.env.NEXT_PUBLIC_TINY_REDIRECT_URL,
  }

  console.log(authorization)

  const response = await fetch('https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(authorization),
  })

  const tokenData = await response.json()

  const db = new AppContext()

  await db.CompanyIntegration.create({
    companyId: 1,
    integrationId: 'E6F39F15-5446-42A7-9AC4-A9A99E604F07',
    options: `${JSON.stringify(tokenData)}`,
    isActive: true
  })

}