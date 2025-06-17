"use server"

import { AppContext } from "@/database"
import { authOptions } from "@/libs/auth"
import _ from "lodash"
import { getServerSession } from "next-auth"
import { Sequelize } from "sequelize"

export async function getUsers() {

  const session = await getServerSession(authOptions)

  const db = new AppContext()

  const users = await db.CompanyUser.findAll({
    where: {
      companyId: session.company.codigo_empresa_filial,
    },
    include: [{
      model: db.User,
      as: 'user',
      attributes: ['userId', 'userName'],
      include: [
        {
          model: db.UserMember,
          as: 'userMember',
          attributes: ['email']
        }
      ]
    }],
    order: [
      [Sequelize.literal('CASE WHEN "isActive" IS NULL THEN 0 ELSE 1 END'), 'ASC'],
      [{ model: db.User, as: 'user' }, 'userName', 'ASC']
    ]
  })

  return _.map(users, (user) => user.get({ plain: true }))

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