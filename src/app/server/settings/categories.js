"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"
import * as sincronize from '@/app/server/sincronize'

export async function findAll() {

  const session = await getServerSession(authOptions)

  await sincronize.categories({ search: ''})

  const db = new AppContext()

  const where = []

  where.push({'$companyId$': session.company.codigo_empresa_filial})

  const categories = await db.FinancialCategory.findAll({
    attributes: ['id', 'description', 'operation'],
    order: [['description', 'asc']],
    where,
    //limit: 20,
    //offset: 0,
  })

  return _.map(categories, (categorie) => categorie.toJSON())

}

export async function findOne({id}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const categorie = await db.FinancialCategory.findOne({
        attributes: ['id', 'description', 'code', 'account', 'operation'],
        where: [{id: id}]
    })

    return categorie.toJSON()

}

export async function submit(values) {

  const session = await getServerSession(authOptions)
  const db = new AppContext()

  const { categorieId, ...rest } = values

  if (categorieId) {
    await db.FinancialCategory.update(rest, { where: { id: categorieId } })
  } else {
    await db.FinancialCategory.create(rest)
  }

}