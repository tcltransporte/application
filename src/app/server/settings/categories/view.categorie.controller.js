"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"

export async function getCategorie({id}) {

    const session = await getServerSession(authOptions)

    const db = new AppContext()

    const categorie = await db.FinancialCategory.findOne({
        attributes: ['id', 'description', 'code', 'account', 'operation'],
        where: [{id: id}]
    })

    return categorie.toJSON()

}

export async function saveCategorie(values) {

  const session = await getServerSession(authOptions)
  const db = new AppContext()

  const { categorieId, ...rest } = values

  if (categorieId) {
    await db.FinancialCategory.update(rest, { where: { id: categorieId } })
  } else {
    await db.FinancialCategory.create(rest)
  }

}

export async function deleteCompanyUser({companyUserId}) {

    const db = new AppContext()

    await db.CompanyUser.destroy({where: [{id: companyUserId}]})
    
}

export async function createCompanyUser({ companyId, userId }) {

    const db = new AppContext()

    const companyUser = await db.CompanyUser.create({ companyId, userId, isActive: true })

    return companyUser.toJSON()

}