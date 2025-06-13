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