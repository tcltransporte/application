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

  const categories = await db.FinancialCategory.findAll({
    attributes: ['id', 'description', 'operation'],
    order: [['description', 'asc']],
    limit: 20,
    offset: 0,
  })

  return _.map(categories, (categorie) => categorie.toJSON())

}

export async function getCompanyUser({ id }) {
  const db = new AppContext();
  const companyUser = await db.CompanyUser.findByPk(id, {
    include: [
      {
        model: db.User,
        as: 'user',
        include: [
          { model: db.UserMember, as: 'userMember' },
          {
            model: db.CompanyUser,
            as: 'companies',
            include: [{ model: db.Company, as: 'company', attributes: ['companyId', 'name'] }]
          }
        ]
      }
    ]
  });
  return companyUser?.get({ plain: true });
}

export async function setCompanyUser({ companyUserId, companies }) {
  const db = new AppContext();

  await Promise.all(
    companies.map(c =>
      db.CompanyUser.update(
        { isActive: c.isActive },
        {
          where: { id: c.id }  // id da relação
        }
      )
    )
  );

  return { success: true };
}

export async function onApprove({id}) {

  const db = new AppContext()

  await db.CompanyUser.update({isActive: true}, {where: [{id}]})

}

export async function onDisapprove({id}) {

  const db = new AppContext()

  await db.CompanyUser.destroy({where: [{id}]})

}

export async function onDisable({ id }) {

  const db = new AppContext()

  await db.CompanyUser.update({isActive: false}, {where: [{ id }]})

}