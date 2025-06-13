"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

export async function onSubmit(values) {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  await db.Company.update({...values}, {where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]})

}