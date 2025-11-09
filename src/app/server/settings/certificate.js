"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

export async function findOne() {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const company = await db.Company.findOne({
    attributes: ['certificate'],
    where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]
  })

  if (!company.certificate) {
    return null
  }

  const certificate = JSON.parse(company.certificate)

  const { password, base64, ...cleanCert } = certificate

  return {
    ...cleanCert,
    subject: parseDN(cleanCert.subject),
    issuer: parseDN(cleanCert.issuer),
  }

}

export async function submit({file, password}) {

  const session = await getServerSession(authOptions)

  const arrayBuffer = await file.arrayBuffer()

  const buffer = Buffer.from(arrayBuffer)

  const base64 = buffer.toString('base64')

  const response = await fetch("http://vps53636.publiccloud.com.br/application/services/certificate/info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cert-Base64": base64,
      "X-Cert-Password": password
    }
  })

  const info = await response.json()

  if (!response.ok) {
    throw new Error(info.message)
  }

  if (info.expired) {

  }

  const certificate = {
    name: file.name,
    size: file.size,
    base64,
    password,
    ...info
  }

  const db = new AppContext()

  await db.Company.update({certificate: JSON.stringify(certificate)}, {where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]})

}

export async function destroy() {
  
  const session = await getServerSession(authOptions)

  const db = new AppContext()

  await db.Company.update({certificate: null}, {where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]})
}

function parseDN(dnString) {
  return dnString.split(',')
    .map(part => part.trim())                     // remove espaços extras
    .map(part => part.split('='))                 // separa chave = valor
    .reduce((acc, [key, value]) => {
      if (!acc[key]) {
        acc[key] = value;                         // se chave ainda não existe
      } else {
        // Se já existe, transforma em array (para múltiplos OU)
        acc[key] = [].concat(acc[key], value);
      }
      return acc;
    }, {});
}