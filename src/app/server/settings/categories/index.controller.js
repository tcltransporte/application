"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"
import * as sincronize from '@/app/server/sincronize'

export async function getCategories() {

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