"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function onSubmit(company) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const updatedData = {
    ...company,
    cityId: company.city?.codigo_municipio ?? null
  }

  if (!updatedData.cityId) {
    throw new Error("E necessário informar a cidade")
  }

  if (company.logo) {

    const base64 = company.logo.includes('base64,') ? company.logo.split('base64,')[1] : company.logo

    updatedData.logo = Buffer.from(base64, 'base64')

  }

  await db.Company.update(updatedData, { where: [{ codigo_empresa_filial: session.company.codigo_empresa_filial }] })

}