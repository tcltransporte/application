"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import { getTinyCategories } from "@/utils/integrations/tiny"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"

export async function getCategories() {

  const session = await getServerSession(authOptions)

  await getTinyCategories()

  const db = new AppContext()

  const where = []

  where.push({'$idEmpresa$': session.company.companyBusinessId})

  const categories = await db.FinancialCategory.findAll({
    attributes: ['id', 'description', 'operation'],
    order: [['description', 'asc']],
    where,
    //limit: 20,
    //offset: 0,
  })

  return _.map(categories, (categorie) => categorie.toJSON())

}