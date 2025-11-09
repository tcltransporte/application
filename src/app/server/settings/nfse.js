"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getServerSession } from "next-auth"

export async function findOne() {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const company = await db.Company.findOne({
    attributes: ['dpsEnvironment', 'dpsLastNum', 'dpsSerie', 'dpsRegimeCalculation', 'dpsRegimeSpecial', 'dpsOptingForSimpleNational'],
    where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]
  })

  return company.toJSON()

}

export async function submit(body) {

  const session = await getServerSession(authOptions)

  const dps = {
    dpsEnvironment: body.dpsEnvironment.toNullIfEmpty(),
    dpsLastNum: body.dpsLastNum.toNullIfEmpty(),
    dpsSerie: body.dpsSerie.toNullIfEmpty(),
    dpsRegimeCalculation: body.dpsRegimeCalculation.toNullIfEmpty(),
    dpsRegimeSpecial: body.dpsRegimeSpecial.toNullIfEmpty(),
    dpsOptingForSimpleNational: body.dpsOptingForSimpleNational.toNullIfEmpty(),
  }

  const db = new AppContext()

  await db.Company.update(dps, {where: [{codigo_empresa_filial: session.company.codigo_empresa_filial}]})

}